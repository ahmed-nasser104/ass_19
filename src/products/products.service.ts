import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../categories/schemas/category.schema.js';
import type { CreateProductInput } from './dto/create-product.dto.js';
import type { UpdateProductInput } from './dto/update-product.dto.js';
import { Product } from './entities/product.entity.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly products: Model<Product>,
    @InjectModel(Category.name) private readonly categories: Model<Category>,
  ) {}

  async create(input: CreateProductInput) {
    if (input.categoryId && !(await this.categories.exists({ _id: input.categoryId }))) {
      throw new BadRequestException('Category does not exist');
    }
    const { categoryId, ...fields } = input;
    return this.products.create({
      ...fields,
      ...(categoryId ? { category: categoryId } : {}),
    });
  }

  findAll() {
    return this.products.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const product = await this.products.findById(id).exec();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, input: UpdateProductInput) {
    if (input.categoryId && !(await this.categories.exists({ _id: input.categoryId }))) {
      throw new BadRequestException('Category does not exist');
    }
    const { categoryId, ...fields } = input;
    const update = {
      ...fields,
      ...(categoryId ? { category: categoryId } : {}),
    };
    const product = await this.products
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async remove(id: string) {
    const product = await this.products.findByIdAndDelete(id).exec();
    if (!product) throw new NotFoundException('Product not found');
    return { deleted: true };
  }
}
