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

  async function loginAsAdmin(agent: ReturnType<typeof request.agent>): Promise<void> {
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

  it('returns a public health response for local integration checks', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((response) => {
        expect(response.body.status).toBe('ok');
        expect(response.body.service).toBe('music-shop-be');
        expect(response.body.apiPrefix).toBe('/api/v1');
        expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
      });
  });

  it('creates an admin session and returns it via auth/session', async () => {
    const agent = request.agent(app.getHttpServer());

    await loginAsAdmin(agent);
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

  it('accepts trimmed admin credentials and returns the same session shape', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/v1/auth/login')
      .send({
        login: '  ADMIN@MUSICSHOP.LOCAL  ',
        password: 'Secret!1'
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.session).toEqual({
          role: 'admin',
          name: 'Admin'
        });
      });
  });

  it('updates settings and uppercases currency', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    await agent
      .put('/api/v1/settings')
      .send({
        currency: ' uzs ',
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

  it('rejects blank category names after trimming input', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    await agent
      .post('/api/v1/categories')
      .send({
        name: '   ',
        status: 'active',
        description: '  valid description  '
      })
      .expect(400)
      .expect((response) => {
        expect(response.body.error.code).toBe('validation_error');
        expect(response.body.error.field).toBe('name');
      });
  });

  it('rejects category self-parenting', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

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

  it('searches products by inline brand text', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    await agent
      .get('/api/v1/products')
      .query({ search: 'fender' })
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body[0].brand).toBe('Fender');
      });
  });

  it('returns public products without requiring a session', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/public/products')
      .expect(200)
      .expect((response) => {
        expect(response.body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'product-player-strat',
              category: expect.objectContaining({
                id: 'category-guitars',
                slug: 'guitars'
              })
            })
          ])
        );
      });
  });

  it('returns backend-driven auth config for admin and client sign-in', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/config/auth')
      .expect(200)
      .expect((response) => {
        expect(response.body.authConfig.providers).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: 'admin-password', type: 'password' }),
            expect.objectContaining({ id: 'client-password', type: 'password' })
          ])
        );
        expect(response.body.authConfig.providers).not.toEqual(
          expect.arrayContaining([expect.objectContaining({ id: 'staff-password' })])
        );
        expect(response.body.authConfig.allowAdminLogin).toBe(true);
        expect(response.body.authConfig.allowClientLogin).toBe(true);
        expect(response.body.authConfig.allowStaffLogin).toBeUndefined();
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

  it('returns backend-driven navigation and permissions for admin-only sections', async () => {
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
        expect(Object.keys(response.body.permissions).sort()).toEqual(['admin', 'client']);
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
        expect(response.body.dictionaries.roles).toHaveLength(2);
      });
  });

  it('creates employees as admin by default and rejects non-admin role values', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    await agent
      .post('/api/v1/employees')
      .send({
        name: 'Front Desk',
        email: 'frontdesk@musicshop.local',
        phone: '+998909998877',
        status: 'active'
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.employee.role).toBe('admin');
      });

    await agent
      .post('/api/v1/employees')
      .send({
        name: 'Legacy Manager',
        email: 'legacy-manager@musicshop.local',
        phone: '+998900001122',
        role: 'client',
        status: 'active'
      })
      .expect(400);
  });

  it('rejects invalid order transition', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

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

  it('returns a single order by id for admin order drill-down', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    await agent
      .get('/api/v1/orders/ORD-1001')
      .expect(200)
      .expect((response) => {
        expect(response.body.order.id).toBe('ORD-1001');
        expect(response.body.order.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              productId: expect.any(String),
              qty: expect.any(Number),
              unitPrice: expect.any(Number)
            })
          ])
        );
      });
  });

  it('returns finance summary for admin users', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

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

  it('forbids client access to admin finance summary', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsClient(agent);

    await agent.get('/api/v1/finance/summary').expect(403);
  });

  it('returns customer aggregates for admin customer list', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    await agent
      .get('/api/v1/customers')
      .expect(200)
      .expect((response) => {
        const amina = response.body.find((item: { id: string }) => item.id === 'customer-001');
        expect(amina.fullName).toBe('Amina Karimova');
        expect(amina.ordersCount).toBe(1);
        expect(amina.repairsCount).toBe(1);
        expect(new Date(amina.registeredAt).toISOString()).toBe(amina.registeredAt);
      });
  });

  it('returns category product counts for admin category list', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    await agent
      .get('/api/v1/categories')
      .expect(200)
      .expect((response) => {
        const strings = response.body.find((item: { id: string }) => item.id === 'category-strings');
        const guitars = response.body.find((item: { id: string }) => item.id === 'category-guitars');
        expect(strings.productCount).toBe(1);
        expect(guitars.productCount).toBe(1);
      });
  });

  it('returns and updates product min stock quantity', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    await agent
      .get('/api/v1/products')
      .expect(200)
      .expect((response) => {
        const product = response.body.find((item: { id: string }) => item.id === 'product-player-strat');
        expect(product.minStockQty).toBe(2);
      });

    await agent
      .put('/api/v1/products/product-player-strat')
      .send({
        minStockQty: 5
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.product.minStockQty).toBe(5);
      });
  });

  it('returns repair admin fields and updates a repair', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    await agent
      .get('/api/v1/repairs')
      .expect(200)
      .expect((response) => {
        expect(response.body.items[0].estimatedCost).toBe(350000);
        expect(response.body.items[0].assignedMasterName).toBe('Akmal R.');
        expect(response.body.items[0].receivedAt).toBe('2026-07-08T00:00:00.000Z');
      });

    await agent
      .put('/api/v1/repairs/REP-2001')
      .send({
        customerId: 'customer-001',
        instrumentName: 'Yamaha P-125',
        brand: 'Yamaha',
        issue: 'Keys intermittently stop responding again.',
        status: 'diagnostics',
        notes: 'Client needs weekend pickup.',
        estimatedCost: 420000,
        assignedMasterName: 'Akmal R.',
        receivedAt: '2026-07-13'
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.repairRequest.status).toBe('diagnostics');
        expect(response.body.repairRequest.estimatedCost).toBe(420000);
        expect(response.body.repairRequest.assignedMasterName).toBe('Akmal R.');
        expect(response.body.repairRequest.receivedAt).toBe('2026-07-13T00:00:00.000Z');
      });
  });

  it('rejects invalid repair updates and missing repairs', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    await agent
      .put('/api/v1/repairs/REP-2001')
      .send({
        customerId: 'missing-customer',
        instrumentName: 'Yamaha P-125',
        brand: 'Yamaha',
        issue: 'Keys intermittently stop responding again.',
        status: 'diagnostics',
        notes: 'Client needs weekend pickup.'
      })
      .expect(400)
      .expect((response) => {
        expect(response.body.error.code).toBe('validation_error');
        expect(response.body.error.field).toBe('customerId');
      });

    await agent
      .put('/api/v1/repairs/REP-2001')
      .send({
        customerId: 'customer-001',
        instrumentName: 'Yamaha P-125',
        brand: 'Yamaha',
        issue: 'Keys intermittently stop responding again.',
        status: 'diagnostics',
        notes: 'Client needs weekend pickup.',
        estimatedCost: -1
      })
      .expect(400)
      .expect((response) => {
        expect(response.body.error.code).toBe('validation_error');
        expect(response.body.error.field).toBe('estimatedCost');
      });

    await agent
      .put('/api/v1/repairs/REP-2001')
      .send({
        customerId: 'customer-001',
        instrumentName: 'Yamaha P-125',
        brand: 'Yamaha',
        issue: 'Keys intermittently stop responding again.',
        status: 'diagnostics',
        notes: 'Client needs weekend pickup.',
        receivedAt: 'not-a-date'
      })
      .expect(400)
      .expect((response) => {
        expect(response.body.error.code).toBe('validation_error');
        expect(response.body.error.field).toBe('receivedAt');
      });

    await agent
      .put('/api/v1/repairs/REP-9999')
      .send({
        customerId: 'customer-001',
        instrumentName: 'Yamaha P-125',
        brand: 'Yamaha',
        issue: 'Keys intermittently stop responding again.',
        status: 'diagnostics',
        notes: 'Client needs weekend pickup.'
      })
      .expect(404)
      .expect((response) => {
        expect(response.body.error.code).toBe('not_found');
      });
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
