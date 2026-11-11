import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './validation.pipe.js';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(
    z.object({ email: z.string().email().transform((value) => value.toLowerCase()) }),
  );

  it('returns parsed and transformed input', () => {
    expect(pipe.transform({ email: 'USER@example.com' }, {} as never)).toEqual({
      email: 'user@example.com',
    });
  });

  it('rejects invalid input with a bad request', () => {
    expect(() => pipe.transform({ email: 'bad' }, {} as never)).toThrow(
      BadRequestException,
    );
  });
});
