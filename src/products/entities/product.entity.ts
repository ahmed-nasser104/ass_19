import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true, versionKey: false })
export class Product {
  @Prop({ required: true, trim: true, maxlength: 160 })
  name!: string;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  description!: string;

  @Prop({ required: true, min: 0.01 })
  price!: number;

  @Prop({ required: true, min: 0, validate: Number.isInteger, default: 0 })
  stock!: number;

  @Prop({ type: Types.ObjectId, ref: 'Category', index: true })
  category?: Types.ObjectId;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
