import { ConflictException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Product } from '../products/entities/product.entity.js';
import { Category } from './schemas/category.schema.js';
import { CategoriesService } from './categories.service.js';

describe('CategoriesService', () => {
  let service: CategoriesService;
  const categories = {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };
  const products = { exists: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getModelToken(Category.name), useValue: categories },
        { provide: getModelToken(Product.name), useValue: products },
      ],
    }).compile();
    service = module.get(CategoriesService);
  });

  it('creates categories with a normalized unique slug', async () => {
    categories.create.mockResolvedValue({ name: 'Home Goods', slug: 'home-goods' });
    await expect(service.create({ name: 'Home Goods' })).resolves.toEqual({
      name: 'Home Goods',
      slug: 'home-goods',
    });
    expect(categories.create).toHaveBeenCalledWith({
      name: 'Home Goods',
      slug: 'home-goods',
    });
  });

  it('translates duplicate category keys to a conflict', async () => {
    categories.create.mockRejectedValue({ code: 11000 });
    await expect(service.create({ name: 'Home Goods' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('prevents deletion while products use a category', async () => {
    categories.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: 'category-id' }),
    });
    products.exists.mockResolvedValue({ _id: 'product-id' });
    await expect(service.remove('0123456789abcdef01234567')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(categories.findByIdAndDelete).not.toHaveBeenCalled();
  });
});
