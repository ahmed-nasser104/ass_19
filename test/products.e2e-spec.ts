import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import request from 'supertest';
import { RolesGuard } from '../src/module/auth/roles.guard.js';
import { JwtAuthGuard } from '../src/module/auth/jwt-auth.guard.js';
import { ProductsController } from '../src/products/products.controller.js';
import { ProductsService } from '../src/products/products.service.js';

describe('Products API authorization and validation (e2e)', () => {
  let app: INestApplication;
  const products = {
    create: vi.fn(),
    findAll: vi.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        RolesGuard,
        { provide: ProductsService, useValue: products },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => Request & { user?: unknown } };
        }) => {
          const req = context.switchToHttp().getRequest();
          const authorization = req.headers.authorization;
          if (!authorization) throw new UnauthorizedException();
          req.user = {
            id: '0123456789abcdef01234567',
            email: 'test@example.com',
            role: authorization.endsWith('admin') ? 'admin' : 'customer',
          };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(() => vi.clearAllMocks());
  afterAll(async () => app.close());

  it('allows public product browsing', async () => {
    products.findAll.mockResolvedValue([]);
    await request(app.getHttpServer()).get('/products').expect(200).expect([]);
  });

  it('protects product writes with authentication and the admin role', async () => {
    const input = {
      name: 'Lamp',
      description: 'Desk lamp',
      price: 24.5,
      stock: 4,
    };
    await request(app.getHttpServer())
      .post('/products')
      .send(input)
      .expect(401);
    await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', 'Bearer customer')
      .send(input)
      .expect(403);
    products.create.mockResolvedValue({ ...input, id: 'lamp-id' });
    await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', 'Bearer admin')
      .send(input)
      .expect(201);
    expect(products.create).toHaveBeenCalledWith(input);
  });

  it('rejects invalid product data', async () => {
    await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', 'Bearer admin')
      .send({ name: 'Lamp', price: -1, stock: -1 })
      .expect(400);
    expect(products.create).not.toHaveBeenCalled();
  });
});
