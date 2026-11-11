import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';

export type PublicUser = Omit<User, 'password'> & { id: string };

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}

  async create(input: Pick<User, 'firstName' | 'lastName' | 'email' | 'password'>): Promise<PublicUser> {
    try {
      const user = await this.users.create(input);
      return this.toPublicUser(user);
    } catch (error) {
      if (this.isDuplicateKey(error)) {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.users.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  async findPublicById(id: string): Promise<PublicUser> {
    const user = await this.users.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toPublicUser(user);
  }

  async findForToken(id: string): Promise<PublicUser | null> {
    const user = await this.users.findById(id).exec();
    return user ? this.toPublicUser(user) : null;
  }

  private toPublicUser(user: UserDocument): PublicUser {
    const value = user.toObject() as User & { _id: { toString(): string } };
    const { password: _password, _id, ...publicFields } = value;
    return { ...publicFields, id: _id.toString() };
  }

  private isDuplicateKey(error: unknown): error is { code: number } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }
}
