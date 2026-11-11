import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { compare, hash } from 'bcryptjs';

describe('AuthService', () => {
  const users = {
    create: vi.fn(),
    findByEmail: vi.fn(),
  };
  const jwt = { signAsync: vi.fn() };
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(users as never, jwt as never);
    jwt.signAsync.mockResolvedValue('signed.jwt.token');
  });

  it('registers a user without returning the password', async () => {
    const user = {
      id: '0123456789abcdef01234567',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      role: 'customer' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    users.create.mockResolvedValue(user);
    const result = await service.register({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'a-long-password',
    });

    expect(users.create).toHaveBeenCalledOnce();
    const [storedUser] = users.create.mock.calls[0];
    expect(storedUser.password).not.toBe('a-long-password');
    await expect(compare('a-long-password', storedUser.password)).resolves.toBe(true);
    expect(result).toEqual({ accessToken: 'signed.jwt.token', user });
    expect(result.user).not.toHaveProperty('password');
    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  });

  it('logs in with a valid password', async () => {
    const password = await hash('correct-password', 4);
    users.findByEmail.mockResolvedValue({
      password,
      toObject: () => ({
        _id: { toString: () => '0123456789abcdef01234567' },
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        role: 'customer',
      }),
    });

    await expect(
      service.login({ email: 'ada@example.com', password: 'correct-password' }),
    ).resolves.toMatchObject({ accessToken: 'signed.jwt.token' });
  });

  it('rejects unknown users and incorrect passwords with the same error', async () => {
    users.findByEmail.mockResolvedValue(null);
    await expect(
      service.login({ email: 'nobody@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    users.findByEmail.mockResolvedValue({
      password: await hash('right-password', 4),
    });
    await expect(
      service.login({ email: 'ada@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });
});
