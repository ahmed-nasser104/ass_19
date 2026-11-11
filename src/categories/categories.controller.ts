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
import { MongoIdPipe } from '../common/pipes/mongo-id.pipe.js';
import { ZodValidationPipe } from '../common/middleware/pipe/validation.pipe.js';
import { JwtAuthGuard } from '../module/auth/jwt-auth.guard.js';
import { Roles } from '../module/auth/roles.decorator.js';
import { RolesGuard } from '../module/auth/roles.guard.js';
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from './dto/category.dto.js';
import { CategoriesService } from './categories.service.js';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body(new ZodValidationPipe(createCategorySchema)) input: CreateCategoryInput) {
    return this.categories.create(input);
  }

  @Get()
  findAll() {
    return this.categories.findAll();
  }

  @Get(':id')
  findOne(@Param('id', MongoIdPipe) id: string) {
    return this.categories.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(
    @Param('id', MongoIdPipe) id: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) input: UpdateCategoryInput,
  ) {
    return this.categories.update(id, input);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', MongoIdPipe) id: string) {
    return this.categories.remove(id);
  }
}
