import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from '../common/middleware/pipe/validation.pipe.js';
import { MongoIdPipe } from '../common/pipes/mongo-id.pipe.js';
import { JwtAuthGuard } from '../module/auth/jwt-auth.guard.js';
import { Roles } from '../module/auth/roles.decorator.js';
import { RolesGuard } from '../module/auth/roles.guard.js';
import {
  createProductSchema,
  type CreateProductInput,
} from './dto/create-product.dto.js';
import {
  updateProductSchema,
  type UpdateProductInput,
} from './dto/update-product.dto.js';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body(new ZodValidationPipe(createProductSchema)) input: CreateProductInput) {
    return this.products.create(input);
  }

  @Get()
  findAll() {
    return this.products.findAll();
  }

  @Get(':id')
  findOne(@Param('id', MongoIdPipe) id: string) {
    return this.products.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(
    @Param('id', MongoIdPipe) id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) input: UpdateProductInput,
  ) {
    return this.products.update(id, input);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', MongoIdPipe) id: string) {
    return this.products.remove(id);
  }
}
