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

  it('clears the active session on logout', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    await agent.post('/api/v1/auth/logout').expect(204);

    await agent
      .get('/api/v1/auth/session')
      .expect(200)
      .expect({
        session: null
      });
  });

  it('returns backend-driven app config for locale and currency bootstrap', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/config/app')
      .expect(200)
      .expect((response) => {
        expect(response.body.appConfig.defaultLocale).toBe('ru');
        expect(response.body.appConfig.supportedLocales).toEqual(['ru', 'en', 'uz']);
        expect(response.body.appConfig.defaultCurrency).toBe('UZS');
        expect(response.body.appConfig.features).toEqual(
          expect.objectContaining({
            clientPortal: true,
            finance: true,
            employees: true,
            settings: true
          })
        );
      });
  });

  it('returns settings for authenticated users and forbids client updates', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsClient(agent);

    await agent
      .get('/api/v1/settings')
      .expect(200)
      .expect((response) => {
        expect(response.body.settings).toEqual({
          currency: 'UZS',
          lowStockThreshold: 3,
          defaultProductStatus: 'draft',
          defaultMarkupPercent: 28
        });
      });

    await agent
      .put('/api/v1/settings')
      .send({
        currency: 'usd',
        lowStockThreshold: 4,
        defaultProductStatus: 'active',
        defaultMarkupPercent: 30
      })
      .expect(403);
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

  it('creates, updates and deletes a category through the admin API', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    let categoryId = '';

    await agent
      .post('/api/v1/categories')
      .send({
        name: ' Stage Pianos ',
        parentId: 'category-pianos',
        status: 'active',
        description: ' Portable digital pianos for rehearsals '
      })
      .expect(201)
      .expect((response) => {
        categoryId = response.body.category.id;
        expect(response.body.category).toEqual(
          expect.objectContaining({
            name: 'Stage Pianos',
            slug: 'stage-pianos',
            parentId: 'category-pianos',
            status: 'active',
            description: 'Portable digital pianos for rehearsals',
            productCount: 0
          })
        );
      });

    await agent
      .put(`/api/v1/categories/${categoryId}`)
      .send({
        name: 'Portable Stage Pianos',
        description: 'Portable digital pianos for stage and rehearsal use'
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.category.slug).toBe('portable-stage-pianos');
        expect(response.body.category.description).toBe(
          'Portable digital pianos for stage and rehearsal use'
        );
      });

    await agent.delete(`/api/v1/categories/${categoryId}`).expect(204);
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

  it('creates, updates, enriches media and deletes a product through admin flows', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    let productId = '';

    await agent
      .post('/api/v1/products')
      .send({
        name: ' Demo Percussion Pad ',
        sku: ' DEMO-PAD-001 ',
        barcode: ' 998877665544 ',
        categoryId: 'category-drums',
        brand: ' Roland ',
        price: 5600000,
        costPrice: 4300000,
        stockQty: 3,
        minStockQty: 1,
        status: 'active',
        shortDescription: ' Compact percussion trigger pad ',
        description: ' Compact percussion trigger pad for rehearsal rooms. ',
        specs: {
          Pads: '8',
          Finish: 'Black'
        },
        images: ['/assets/roland-spd-sx.jpg'],
        primaryImage: '/assets/roland-spd-sx.jpg',
        condition: 'new'
      })
      .expect(201)
      .expect((response) => {
        productId = response.body.product.id;
        expect(response.body.product).toEqual(
          expect.objectContaining({
            sku: 'DEMO-PAD-001',
            barcode: '998877665544',
            brand: 'Roland',
            stockQty: 3,
            primaryImage: '/assets/roland-spd-sx.jpg'
          })
        );
      });

    await agent
      .put(`/api/v1/products/${productId}`)
      .send({
        stockQty: 5,
        minStockQty: 2,
        shortDescription: 'Compact percussion pad for hybrid kits'
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.product.stockQty).toBe(5);
        expect(response.body.product.minStockQty).toBe(2);
        expect(response.body.product.shortDescription).toBe(
          'Compact percussion pad for hybrid kits'
        );
      });

    await agent
      .post(`/api/v1/products/${productId}/images`)
      .send({
        image: 'products/custom/demo-pad.png'
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.product.images).toContain('/assets/custom/demo-pad.png');
      });

    await agent
      .post(`/api/v1/products/${productId}/primary-image`)
      .send({
        image: '/assets/custom/demo-pad.png'
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.product.primaryImage).toBe('/assets/custom/demo-pad.png');
      });

    await agent
      .get(`/api/v1/products/${productId}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.product.primaryImage).toBe('/assets/custom/demo-pad.png');
        expect(response.body.product.images).toContain('/assets/custom/demo-pad.png');
      });

    await agent.delete(`/api/v1/products/${productId}`).expect(204);
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

  it('lists admin orders with filter support', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    await agent
      .get('/api/v1/orders')
      .query({
        paymentStatus: 'pending',
        limit: 2
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.items).toHaveLength(2);
        expect(response.body.items.every((item: { paymentStatus: string }) => item.paymentStatus === 'pending')).toBe(true);
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

  it('returns a public product by id for storefront details', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/public/products/product-shure-sm7b')
      .expect(200)
      .expect((response) => {
        expect(response.body.product).toEqual(
          expect.objectContaining({
            id: 'product-shure-sm7b',
            brand: 'Shure',
            category: expect.objectContaining({
              id: 'category-microphones',
              slug: 'microphones'
            })
          })
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

  it('returns activity feed items with limit support for admin dashboards', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    await agent
      .get('/api/v1/activity')
      .query({ limit: 3 })
      .expect(200)
      .expect((response) => {
        expect(response.body.items).toHaveLength(3);
        expect(response.body.items[0].messageKey).toBe('activity.inventoryAdjusted');
        expect(response.body.items[0].messageParams).toEqual(
          expect.objectContaining({
            productId: expect.any(String),
            delta: expect.any(Number)
          })
        );
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

  it('lists, updates and deletes employees through the admin API', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    let employeeId = '';

    await agent
      .post('/api/v1/employees')
      .send({
        name: 'Operations Clerk',
        email: 'operations.clerk@musicshop.local',
        phone: '+998900001234',
        status: 'active'
      })
      .expect(201)
      .expect((response) => {
        employeeId = response.body.employee.id;
      });

    await agent
      .get('/api/v1/employees')
      .expect(200)
      .expect((response) => {
        expect(response.body.some((item: { id: string }) => item.id === employeeId)).toBe(true);
      });

    await agent
      .put(`/api/v1/employees/${employeeId}`)
      .send({
        name: 'Operations Coordinator',
        status: 'inactive'
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.employee.name).toBe('Operations Coordinator');
        expect(response.body.employee.status).toBe('inactive');
      });

    await agent.delete(`/api/v1/employees/${employeeId}`).expect(204);
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
        revenue: 55500000,
        grossMargin: 12000000,
        paidOrders: 2,
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
        expect(response.body).toHaveLength(10);
        const amina = response.body.find((item: { id: string }) => item.id === 'customer-001');
        expect(amina.fullName).toBe('Amina Karimova');
        expect(amina.ordersCount).toBe(1);
        expect(amina.repairsCount).toBe(1);
        expect(new Date(amina.registeredAt).toISOString()).toBe(amina.registeredAt);
      });
  });

  it('creates, updates and deletes a customer through the admin API', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    let customerId = '';

    await agent
      .post('/api/v1/customers')
      .send({
        name: '  Test Customer ',
        fullName: ' Test Customer Full ',
        phone: '+998901111111',
        email: 'test.customer@example.com',
        tier: 'standard',
        status: 'active',
        notes: ' Walk-in client '
      })
      .expect(201)
      .expect((response) => {
        customerId = response.body.customer.id;
        expect(response.body.customer).toEqual(
          expect.objectContaining({
            name: 'Test Customer',
            fullName: 'Test Customer Full',
            email: 'test.customer@example.com',
            tier: 'standard',
            notes: 'Walk-in client'
          })
        );
      });

    await agent
      .put(`/api/v1/customers/${customerId}`)
      .send({
        tier: 'vip',
        notes: 'VIP walk-in client'
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.customer.tier).toBe('vip');
        expect(response.body.customer.notes).toBe('VIP walk-in client');
      });

    await agent.delete(`/api/v1/customers/${customerId}`).expect(204);
  });

  it('returns category product counts for admin category list', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    await agent
      .get('/api/v1/categories')
      .expect(200)
      .expect((response) => {
        const pianos = response.body.find((item: { id: string }) => item.id === 'category-pianos');
        const guitars = response.body.find((item: { id: string }) => item.id === 'category-guitars');
        expect(pianos.productCount).toBe(1);
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

  it('lists and adjusts inventory through admin inventory endpoints', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    await agent
      .get('/api/v1/inventory/movements')
      .query({
        productId: 'product-shure-sm7b',
        limit: 2
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0].productId).toBe('product-shure-sm7b');
      });

    await agent
      .post('/api/v1/inventory/adjustments')
      .send({
        productId: 'product-roland-spd-sx',
        delta: 2,
        reason: '  showroom restock  '
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.product).toEqual({
          id: 'product-roland-spd-sx',
          stockQty: 3
        });
        expect(response.body.movement).toEqual(
          expect.objectContaining({
            productId: 'product-roland-spd-sx',
            delta: 2,
            reason: 'showroom restock'
          })
        );
      });
  });

  it('normalizes blank product barcodes to null on update', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    await agent
      .put('/api/v1/products/product-player-strat')
      .send({
        barcode: '   '
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.product.barcode).toBeNull();
      });

    await agent
      .get('/api/v1/products/product-player-strat')
      .expect(200)
      .expect((response) => {
        expect(response.body.product.barcode).toBeNull();
      });
  });

  it('creates repair requests through admin and client APIs', async () => {
    const adminAgent = request.agent(app.getHttpServer());
    await loginAsAdmin(adminAgent);

    await adminAgent
      .post('/api/v1/repairs')
      .send({
        customerId: 'customer-002',
        instrumentName: ' Yamaha Arius ',
        brand: ' Yamaha ',
        issue: ' Pedal intermittently disconnects during rehearsal. ',
        notes: ' Inspect sustain pedal jack. ',
        estimatedCost: 260000,
        assignedMasterName: ' Sardor K. ',
        receivedAt: '2026-07-20T08:30:00.000Z'
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.repairRequest).toEqual(
          expect.objectContaining({
            customerId: 'customer-002',
            instrumentName: 'Yamaha Arius',
            brand: 'Yamaha',
            estimatedCost: 260000,
            assignedMasterName: 'Sardor K.'
          })
        );
      });

    const clientAgent = request.agent(app.getHttpServer());
    await loginAsClient(clientAgent);

    await clientAgent
      .post('/api/v1/client/repairs')
      .send({
        instrumentName: ' Korg B2 ',
        brand: ' Korg ',
        issue: ' Speaker distorts above medium volume. ',
        notes: ' Please inspect internal speaker connection. '
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.repairRequest.customerId).toBe('customer-001');
        expect(response.body.repairRequest.instrumentName).toBe('Korg B2');
        expect(response.body.repairRequest.brand).toBe('Korg');
        expect(response.body.repairRequest.status).toBe('new');
      });
  });

  it('returns repair admin fields and updates a repair', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(agent);

    await agent
      .get('/api/v1/repairs')
      .expect(200)
      .expect((response) => {
        const repair = response.body.items.find((item: { id: string }) => item.id === 'REP-2001');
        expect(repair.estimatedCost).toBe(350000);
        expect(repair.assignedMasterName).toBe('Akmal R.');
        expect(repair.receivedAt).toBe('2026-07-08T00:00:00.000Z');
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

  it('returns client profile, products and repairs for the client portal', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsClient(agent);

    await agent
      .get('/api/v1/client/me')
      .expect(200)
      .expect((response) => {
        expect(response.body.customer).toEqual(
          expect.objectContaining({
            id: 'customer-001',
            email: 'amina@example.com'
          })
        );
      });

    await agent
      .get('/api/v1/client/products')
      .expect(200)
      .expect((response) => {
        expect(response.body.items.length).toBeGreaterThan(0);
        expect(response.body.items.every((item: { status: string }) => item.status === 'active')).toBe(true);
      });

    await agent
      .get('/api/v1/client/repairs')
      .expect(200)
      .expect((response) => {
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0].customerId).toBe('customer-001');
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

  it('creates public orders and public repairs without authentication', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/public/orders')
      .send({
        customerName: '  Public Buyer ',
        phone: '+998907771122',
        email: 'PUBLIC.BUYER@example.com',
        address: '  Tashkent city, Chilanzar district ',
        paymentMethod: 'card',
        comment: ' Please call before delivery. ',
        items: [
          {
            productId: 'product-shure-sm7b',
            qty: 1,
            unitPrice: 4200000
          }
        ]
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.order.customerId).toMatch(/^customer/);
        expect(response.body.order.status).toBe('new');
        expect(response.body.order.notes).toContain('Public checkout');
        expect(response.body.order.notes).toContain('Email: public.buyer@example.com');
      });

    await request(app.getHttpServer())
      .post('/api/v1/public/repairs')
      .send({
        customerName: '  Repair Guest ',
        phone: '+998908881133',
        email: 'repair.guest@example.com',
        instrumentType: 'Digital piano',
        instrumentModel: 'Casio PX-S1100',
        issueDescription: ' Speakers crackle after ten minutes of use. ',
        photoUrl: 'https://example.com/repair-photo.jpg'
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.repairRequest.customerId).toMatch(/^customer/);
        expect(response.body.repairRequest.instrumentName).toBe('Digital piano');
        expect(response.body.repairRequest.brand).toBe('Casio PX-S1100');
        expect(response.body.repairRequest.notes).toContain('Public repair request');
        expect(response.body.repairRequest.notes).toContain('Photo: https://example.com/repair-photo.jpg');
      });
  });
});
