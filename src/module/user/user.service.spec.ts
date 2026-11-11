import { ConflictException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { User } from './schemas/user.schema.js';
import { UserService } from './user.service.js';

describe('UserService', () => {
  let service: UserService;
  const users = {
    create: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: users },
      ],
    }).compile();
    service = module.get(UserService);
  });

  it('creates users without returning password hashes', async () => {
    users.create.mockResolvedValue({
      toObject: () => ({
        _id: { toString: () => '0123456789abcdef01234567' },
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        password: 'stored-hash',
        role: 'customer',
      }),
    });

    await expect(
      service.create({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        password: 'stored-hash',
      }),
    ).resolves.toMatchObject({ email: 'ada@example.com' });
    await expect(
      service.create({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        password: 'stored-hash',
      }),
    ).resolves.not.toHaveProperty('password');
  });

  it('converts duplicate email index errors to a conflict', async () => {
    users.create.mockRejectedValue({ code: 11000 });
    await expect(
      service.create({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        password: 'stored-hash',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
