import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { AuthenticatedUser } from '../module/auth/auth.types.js';
import type { CreateOrderInput, UpdateOrderStatusInput } from './dto/order.dto.js';
import { Order, OrderStatus } from './schemas/order.schema.js';
import { Product } from '../products/entities/product.entity.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
  ) {}

  async create(customerId: string, input: CreateOrderInput) {
    const quantities = new Map<string, number>();
    for (const item of input.items) {
      const quantity = (quantities.get(item.productId) ?? 0) + item.quantity;
      if (quantity > 100) {
        throw new BadRequestException('Maximum quantity per product is 100');
      }
      quantities.set(item.productId, quantity);
    }

    const productIds = [...quantities.keys()];
    const availableProducts = await this.products.find({ _id: { $in: productIds } }).exec();
    const productsById = new Map(
      availableProducts.map((product) => [product._id.toString(), product]),
    );
    for (const [productId, quantity] of quantities) {
      const product = productsById.get(productId);
      if (!product) throw new NotFoundException(`Product ${productId} not found`);
      if (product.stock < quantity) {
        throw new ConflictException(`Insufficient stock for ${product.name}`);
      }
    }

    const reserved: Array<{ productId: string; quantity: number }> = [];
    try {
      for (const [productId, quantity] of quantities) {
        const product = await this.products
          .findOneAndUpdate(
            { _id: productId, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
            { new: true },
          )
          .exec();
        if (!product) {
          throw new ConflictException('Product stock changed; please retry the order');
        }
        reserved.push({ productId, quantity });
      }

      const items = [...quantities].map(([productId, quantity]) => {
        const product = productsById.get(productId)!;
        return {
          product: new Types.ObjectId(productId),
          productName: product.name,
          quantity,
          unitPrice: product.price,
        };
      });
      const totalAmount =
        Math.round(
          items.reduce((total, item) => total + item.quantity * item.unitPrice, 0) * 100,
        ) / 100;
      return await this.orders.create({
        customer: new Types.ObjectId(customerId),
        items,
        totalAmount,
        status: 'pending',
      });
    } catch (error) {
      const rollbacks = await Promise.allSettled(
        reserved.map(({ productId, quantity }) =>
          this.products
            .updateOne({ _id: productId }, { $inc: { stock: quantity } })
            .exec(),
        ),
      );
      if (rollbacks.some((result) => result.status === 'rejected')) {
        this.logger.error('Failed to restore reserved product stock after order failure');
        throw new InternalServerErrorException(
          'Order failed and stock recovery requires operator attention',
        );
      }
      throw error;
    }
  }

  findAll() {
    return this.orders.find().sort({ createdAt: -1 }).exec();
  }

  findMine(customerId: string) {
    return this.orders.find({ customer: customerId }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, requester: AuthenticatedUser) {
    const order = await this.orders.findById(id).exec();
    if (!order) throw new NotFoundException('Order not found');
    if (
      requester.role !== 'admin' &&
      order.customer.toString() !== requester.id
    ) {
      throw new ForbiddenException('You cannot access this order');
    }
    return order;
  }

  async updateStatus(id: string, input: UpdateOrderStatusInput) {
    const order = await this.orders.findById(id).exec();
    if (!order) throw new NotFoundException('Order not found');
    if (!this.canTransition(order.status, input.status)) {
      throw new BadRequestException(
        `Order cannot transition from ${order.status} to ${input.status}`,
      );
    }
    const updated = await this.orders
      .findOneAndUpdate(
        { _id: id, status: order.status },
        { $set: { status: input.status } },
        { new: true, runValidators: true },
      )
      .exec();
    if (!updated) {
      throw new ConflictException('Order status changed; reload and retry');
    }
    return updated;
  }

  private canTransition(current: OrderStatus, next: OrderStatus): boolean {
    const allowed: Record<OrderStatus, readonly OrderStatus[]> = {
      pending: ['processing'],
      processing: ['shipped'],
      shipped: ['delivered'],
      delivered: [],
    };
    return allowed[current].includes(next);
  }
}
