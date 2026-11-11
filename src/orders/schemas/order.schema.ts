import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product!: Types.ObjectId;

  @Prop({ required: true })
  productName!: string;

  @Prop({ required: true, min: 1, validate: Number.isInteger })
  quantity!: number;

  @Prop({ required: true, min: 0.01 })
  unitPrice!: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true, versionKey: false })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  customer!: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items!: OrderItem[];

  @Prop({ required: true, min: 0 })
  totalAmount!: number;

  @Prop({
    type: String,
    required: true,
    enum: ORDER_STATUSES,
    default: 'pending',
    index: true,
  })
  status!: OrderStatus;

  createdAt!: Date;
  updatedAt!: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
