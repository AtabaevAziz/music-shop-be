import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/database/prisma.service';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { seedDatabase } from '../prisma/seed';
import request from 'supertest';

describe('Music Shop initial phase (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  async function loginAsStaff(agent: ReturnType<typeof request.agent>): Promise<void> {
    await agent
      .post('/api/v1/auth/login')
      .send({
        login: 'admin',
        password: 'Secret!1'
      })
      .expect(200);
  }

  async function loginAsClient(agent: ReturnType<typeof request.agent>): Promise<void> {
    await agent
      .post('/api/v1/auth/login')
      .send({
        login: 'amina@example.com',
        password: 'amina@example.com'
      })
      .expect(200);
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await seedDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns null session when no cookie is present', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .expect(200)
      .expect({
        session: null
      });
  });

  it('creates a staff session and returns it via auth/session', async () => {
    const agent = request.agent(app.getHttpServer());

    await loginAsStaff(agent);
    await agent
      .get('/api/v1/auth/session')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({
          session: {
            role: 'admin',
            name: 'Admin'
          }
        });
      });
  });

  it('updates settings and uppercases currency', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsStaff(agent);

    await agent
      .put('/api/v1/settings')
      .send({
        currency: 'uzs',
        lowStockThreshold: 5,
        defaultProductStatus: 'draft',
        defaultMarkupPercent: 32
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.settings.currency).toBe('UZS');
        expect(response.body.settings.lowStockThreshold).toBe(5);
        expect(response.body.settings.defaultMarkupPercent).toBe(32);
      });
  });

  it('rejects category self-parenting', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsStaff(agent);

    await agent
      .put('/api/v1/categories/category-guitars')
      .send({
        parentId: 'category-guitars'
      })
      .expect(400)
      .expect((response) => {
        expect(response.body.error.code).toBe('validation_error');
        expect(response.body.error.field).toBe('parentId');
      });
  });

  it('rejects duplicate brand names', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsStaff(agent);

    await agent
      .post('/api/v1/brands')
      .send({
        name: 'Fender',
        country: 'USA',
        website: 'https://www.fender.com',
        status: 'active'
      })
      .expect(409)
      .expect((response) => {
        expect(response.body.error.code).toBe('conflict');
        expect(response.body.error.field).toBe('name');
      });
  });

  it('returns backend-driven workflows config', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/config/workflows')
      .expect(200)
      .expect((response) => {
        expect(response.body.workflows.orders.statuses).toContain('ready_for_pickup');
        expect(response.body.workflows.orders.transitions.new).toEqual(['confirmed', 'cancelled']);
      });
  });

  it('returns backend-driven navigation and permissions for staff-only sections', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/config/navigation')
      .expect(200)
      .expect((response) => {
        const routeIds = response.body.items.map((item: { id: string }) => item.id);
        expect(routeIds).toEqual(
          expect.arrayContaining(['employees', 'finance', 'settings'])
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/config/permissions')
      .expect(200)
      .expect((response) => {
        expect(response.body.permissions.admin).toEqual(
          expect.arrayContaining(['employees', 'finance', 'settings'])
        );
        expect(response.body.permissions.client).not.toEqual(
          expect.arrayContaining(['employees', 'finance', 'settings'])
        );
      });
  });

  it('returns dictionaries in the shape expected by the frontend', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/config/dictionaries')
      .expect(200)
      .expect((response) => {
        expect(response.body.dictionaries.customerTiers).toEqual(
          expect.arrayContaining([
            { value: 'standard', labelKey: 'dynamic.standard' },
            { value: 'studio', labelKey: 'dynamic.studio' },
            { value: 'vip', labelKey: 'dynamic.vip' }
          ])
        );
        expect(response.body.dictionaries.roles).toEqual(
          expect.arrayContaining([
            { value: 'admin', labelKey: 'dynamic.admin' },
            { value: 'client', labelKey: 'dynamic.client' }
          ])
        );
      });
  });

  it('rejects invalid order transition', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsStaff(agent);

    await agent
      .post('/api/v1/orders/ORD-1001/status')
      .send({
        status: 'new'
      })
      .expect(409)
      .expect((response) => {
        expect(response.body.error.code).toBe('invalid_transition');
      });
  });

  it('returns finance summary for staff users', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsStaff(agent);

    await agent
      .get('/api/v1/finance/summary')
      .expect(200)
      .expect({
        revenue: 9800000,
        grossMargin: 2200000,
        paidOrders: 0,
        currency: 'UZS'
      });
  });

  it('forbids client access to staff finance summary', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsClient(agent);

    await agent.get('/api/v1/finance/summary').expect(403);
  });

  it('creates a client order, reserves stock and creates a movement', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsClient(agent);

    await agent
      .post('/api/v1/client/orders')
      .send({
        items: [
          {
            productId: 'product-yamaha-p125',
            qty: 1,
            unitPrice: 8700000
          }
        ],
        notes: 'Please confirm pickup time.'
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.order.customerId).toBe('customer-001');
        expect(response.body.order.status).toBe('new');
        expect(response.body.order.items[0].unitPrice).toBe(8700000);
      });

    const updatedProduct = await prisma.product.findUnique({
      where: { id: 'product-yamaha-p125' }
    });
    const movement = await prisma.inventoryMovement.findFirst({
      where: {
        productId: 'product-yamaha-p125',
        delta: -1
      },
      orderBy: [{ createdAt: 'desc' }]
    });

    expect(updatedProduct?.stockQty).toBe(1);
    expect(movement?.reason).toContain('Reserved for client order');
  });

  it('returns only current client orders in client portal', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsClient(agent);

    await agent
      .get('/api/v1/client/orders')
      .expect(200)
      .expect((response) => {
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0].customerId).toBe('customer-001');
      });
  });
});
