import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { UserService } from '../user/user.service.js';
import type { PublicUser } from '../user/user.service.js';
import type { AuthenticatedUser } from './auth.types.js';
import type { LoginInput, RegisterInput } from './auth.validation.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const password = await hash(input.password, 12);
    const user = await this.users.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password,
    });
    return this.issueToken(user);
  }

  async login(input: LoginInput) {
    const user = await this.users.findByEmail(input.email);
    if (!user || !(await compare(input.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { password: _password, _id, ...userFields } = user.toObject();
    const publicUser: PublicUser = { ...userFields, id: _id.toString() };
    return this.issueToken(publicUser);
  }

  private async issueToken(user: PublicUser) {
    const payload: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwt.signAsync({
      sub: payload.id,
      email: payload.email,
      role: payload.role,
    });
    return { accessToken, user };
  }
}
