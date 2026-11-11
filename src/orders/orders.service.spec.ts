import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Product } from '../products/entities/product.entity.js';
import { Order } from './schemas/order.schema.js';
import { OrdersService } from './orders.service.js';

const productId = '0123456789abcdef01234567';
const customerId = '1123456789abcdef01234567';

describe('OrdersService', () => {
  let service: OrdersService;
  const orderModel = {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findOneAndUpdate: vi.fn(),
  };
  const productModel = {
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(Product.name), useValue: productModel },
      ],
    }).compile();
    service = module.get(OrdersService);
  });

  it('creates an order using database prices and reserves stock', async () => {
    const product = {
      _id: { toString: () => productId },
      name: 'Lamp',
      price: 12.5,
      stock: 5,
    };
    productModel.find.mockReturnValue({ exec: vi.fn().mockResolvedValue([product]) });
    productModel.findOneAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue(product),
    });
    const order = { totalAmount: 25 };
    orderModel.create.mockResolvedValue(order);

    await expect(
      service.create(customerId, {
        items: [
          { productId, quantity: 1 },
          { productId, quantity: 1 },
        ],
      }),
    ).resolves.toBe(order);
    expect(productModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: productId, stock: { $gte: 2 } },
      { $inc: { stock: -2 } },
      { new: true },
    );
    expect(orderModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: expect.anything(),
        totalAmount: 25,
        items: [
          expect.objectContaining({
            productName: 'Lamp',
            quantity: 2,
            unitPrice: 12.5,
          }),
        ],
      }),
    );
  });

  it('rejects unknown products and insufficient stock', async () => {
    productModel.find.mockReturnValue({ exec: vi.fn().mockResolvedValue([]) });
    await expect(
      service.create(customerId, { items: [{ productId, quantity: 1 }] }),
    ).rejects.toBeInstanceOf(NotFoundException);

    productModel.find.mockReturnValue({
      exec: vi.fn().mockResolvedValue([
        { _id: { toString: () => productId }, name: 'Lamp', price: 1, stock: 0 },
      ]),
    });
    await expect(
      service.create(customerId, { items: [{ productId, quantity: 1 }] }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(productModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('restores reserved stock if order persistence fails', async () => {
    const product = {
      _id: { toString: () => productId },
      name: 'Lamp',
      price: 12.5,
      stock: 5,
    };
    productModel.find.mockReturnValue({ exec: vi.fn().mockResolvedValue([product]) });
    productModel.findOneAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue(product),
    });
    productModel.updateOne.mockReturnValue({ exec: vi.fn().mockResolvedValue({}) });
    orderModel.create.mockRejectedValue(new Error('database write failed'));

    await expect(
      service.create(customerId, { items: [{ productId, quantity: 1 }] }),
    ).rejects.toThrow('database write failed');
    expect(productModel.updateOne).toHaveBeenCalledWith(
      { _id: productId },
      { $inc: { stock: 1 } },
    );
  });

  it("prevents customers from viewing another customer's order", async () => {
    orderModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        customer: { toString: () => customerId },
      }),
    });
    await expect(
      service.findOne('2123456789abcdef01234567', {
        id: '3123456789abcdef01234567',
        email: 'user@example.com',
        role: 'customer',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects invalid order status transitions', async () => {
    orderModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ status: 'pending' }),
    });
    await expect(
      service.updateStatus('2123456789abcdef01234567', { status: 'delivered' }),
    ).rejects.toThrow('Order cannot transition');
    expect(orderModel.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
