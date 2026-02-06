import { Injectable } from '@nestjs/common';
import { CreateIdempotencyKeyDto } from './dto/create-idempotency-key.dto';
import { UpdateIdempotencyKeyDto } from './dto/update-idempotency-key.dto';

@Injectable()
export class IdempotencyKeysService {
  create(_createIdempotencyKeyDto: CreateIdempotencyKeyDto) {
    return 'This action adds a new idempotencyKey';
  }

  findAll() {
    return `This action returns all idempotencyKeys`;
  }

  findOne(id: number) {
    return `This action returns a #${id} idempotencyKey`;
  }

  update(id: number, _updateIdempotencyKeyDto: UpdateIdempotencyKeyDto) {
    return `This action updates a #${id} idempotencyKey`;
  }

  remove(id: number) {
    return `This action removes a #${id} idempotencyKey`;
  }
}
