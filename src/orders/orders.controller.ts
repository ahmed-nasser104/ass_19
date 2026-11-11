import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MongoIdPipe } from '../common/pipes/mongo-id.pipe.js';
import { ZodValidationPipe } from '../common/middleware/pipe/validation.pipe.js';
import { CurrentUser } from '../module/auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../module/auth/auth.types.js';
import { JwtAuthGuard } from '../module/auth/jwt-auth.guard.js';
import { Roles } from '../module/auth/roles.decorator.js';
import { RolesGuard } from '../module/auth/roles.guard.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  type CreateOrderInput,
  type UpdateOrderStatusInput,
} from './dto/order.dto.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createOrderSchema)) input: CreateOrderInput,
  ) {
    return this.orders.create(user.id, input);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAll() {
    return this.orders.findAll();
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.orders.findMine(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', MongoIdPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orders.findOne(id, user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateStatus(
    @Param('id', MongoIdPipe) id: string,
    @Body(new ZodValidationPipe(updateOrderStatusSchema)) input: UpdateOrderStatusInput,
  ) {
    return this.orders.updateStatus(id, input);
  }
}
