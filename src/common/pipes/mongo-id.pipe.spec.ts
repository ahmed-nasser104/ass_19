import { BadRequestException } from '@nestjs/common';
import { MongoIdPipe } from './mongo-id.pipe.js';

describe('MongoIdPipe', () => {
  it('accepts a 24-character hexadecimal ObjectId', () => {
    expect(new MongoIdPipe().transform('0123456789abcdef01234567')).toBe(
      '0123456789abcdef01234567',
    );
  });

  it('rejects malformed identifiers', () => {
    expect(() => new MongoIdPipe().transform('not-an-id')).toThrow(
      BadRequestException,
    );
  });
});
