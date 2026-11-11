import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../products/entities/product.entity.js';
import type { CreateCategoryInput, UpdateCategoryInput } from './dto/category.dto.js';
import { Category } from './schemas/category.schema.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly categories: Model<Category>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
  ) {}

  async create(input: CreateCategoryInput) {
    const slug = this.slugFor(input.name);
    if (!slug) throw new BadRequestException('Category name must contain letters or numbers');
    try {
      return await this.categories.create({
        ...input,
        name: input.name.trim(),
        slug,
      });
    } catch (error) {
      if (this.isDuplicateKey(error)) {
        throw new ConflictException('A category with this name already exists');
      }
      throw error;
    }
  }

  findAll() {
    return this.categories.find().sort({ name: 1 }).exec();
  }

  async findOne(id: string) {
    const category = await this.categories.findById(id).exec();
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, input: UpdateCategoryInput) {
    const update: Partial<Category> = { ...input };
    if (input.name) {
      const slug = this.slugFor(input.name);
      if (!slug) throw new BadRequestException('Category name must contain letters or numbers');
      update.name = input.name.trim();
      update.slug = slug;
    }
    try {
      const category = await this.categories
        .findByIdAndUpdate(id, update, { new: true, runValidators: true })
        .exec();
      if (!category) throw new NotFoundException('Category not found');
      return category;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (this.isDuplicateKey(error)) {
        throw new ConflictException('A category with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const category = await this.categories.findById(id).exec();
    if (!category) throw new NotFoundException('Category not found');
    if (await this.products.exists({ category: id })) {
      throw new ConflictException('Category is assigned to one or more products');
    }
    await this.categories.findByIdAndDelete(id).exec();
    return { deleted: true };
  }

  private slugFor(name: string): string {
    return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private isDuplicateKey(error: unknown): error is { code: number } {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  }
}
