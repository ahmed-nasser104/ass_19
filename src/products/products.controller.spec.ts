import { Test } from '@nestjs/testing';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

describe('ProductsController', () => {
  it('delegates public product browsing to the service', async () => {
    const products = [{ id: 'one' }];
    const service = { findAll: vi.fn().mockResolvedValue(products) };
    const module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: service }],
    }).compile();
    const controller = module.get(ProductsController);

    await expect(controller.findAll()).resolves.toBe(products);
    expect(service.findAll).toHaveBeenCalledOnce();
  });
});
