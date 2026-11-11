import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const USER_ROLES = ['customer', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];
export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, versionKey: false })
export class User {
  @Prop({ required: true, trim: true, maxlength: 80 })
  firstName!: string;

  @Prop({ required: true, trim: true, maxlength: 80 })
  lastName!: string;

  @Prop({ required: true, lowercase: true, trim: true, unique: true, index: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ type: String, required: true, enum: USER_ROLES, default: 'customer' })
  role!: UserRole;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
