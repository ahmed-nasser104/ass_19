import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor() {}

  login(): string {
    return 'login';
  }
}
