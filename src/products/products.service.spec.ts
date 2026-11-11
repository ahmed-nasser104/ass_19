import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Category } from '../categories/schemas/category.schema.js';
import { Product } from './entities/product.entity.js';
import { ProductsService } from './products.service.js';

describe('ProductsService', () => {
  let service: ProductsService;
  const productModel = {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };
  const categoryModel = { exists: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getModelToken(Product.name), useValue: productModel },
        { provide: getModelToken(Category.name), useValue: categoryModel },
      ],
    }).compile();
    service = module.get(ProductsService);
  });

  it('creates a validated product without a category', async () => {
    const input = {
      name: 'Desk',
      description: 'Wood desk',
      price: 99.99,
      stock: 3,
    };
    productModel.create.mockResolvedValue(input);

    await expect(service.create(input)).resolves.toEqual(input);
    expect(productModel.create).toHaveBeenCalledWith(input);
  });

  it('rejects a product whose category does not exist', async () => {
    categoryModel.exists.mockResolvedValue(null);
    await expect(
      service.create({
        name: 'Desk',
        description: 'Wood desk',
        price: 99,
        stock: 3,
        categoryId: '0123456789abcdef01234567',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(productModel.create).not.toHaveBeenCalled();
  });

  it('returns products from the database', async () => {
    const products = [{ name: 'Desk' }];
    const query = { sort: vi.fn().mockReturnThis(), exec: vi.fn().mockResolvedValue(products) };
    productModel.find.mockReturnValue(query);
    await expect(service.findAll()).resolves.toBe(products);
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('returns 404 when a product is absent', async () => {
    productModel.findById.mockReturnValue({ exec: vi.fn().mockResolvedValue(null) });
    await expect(service.findOne('0123456789abcdef01234567')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates and deletes existing products', async () => {
    const product = { name: 'New name' };
    productModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue(product),
    });
    productModel.findByIdAndDelete.mockReturnValue({
      exec: vi.fn().mockResolvedValue(product),
    });

    await expect(
      service.update('0123456789abcdef01234567', { name: 'New name' }),
    ).resolves.toBe(product);
    await expect(service.remove('0123456789abcdef01234567')).resolves.toEqual({
      deleted: true,
    });
  });
});
