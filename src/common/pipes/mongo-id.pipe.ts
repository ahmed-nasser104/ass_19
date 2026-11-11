import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class MongoIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!/^[\da-f]{24}$/i.test(value)) {
      throw new BadRequestException('Invalid MongoDB ObjectId');
    }
    return value;
  }
}
