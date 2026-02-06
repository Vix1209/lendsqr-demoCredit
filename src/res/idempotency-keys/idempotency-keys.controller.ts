import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { IdempotencyKeysService } from './idempotency-keys.service';
import { CreateIdempotencyKeyDto } from './dto/create-idempotency-key.dto';
import { UpdateIdempotencyKeyDto } from './dto/update-idempotency-key.dto';

@Controller('idempotency-keys')
export class IdempotencyKeysController {
  constructor(
    private readonly idempotencyKeysService: IdempotencyKeysService,
  ) {}

  @Post()
  create(@Body() createIdempotencyKeyDto: CreateIdempotencyKeyDto) {
    return this.idempotencyKeysService.create(createIdempotencyKeyDto);
  }

  @Get()
  findAll() {
    return this.idempotencyKeysService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.idempotencyKeysService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIdempotencyKeyDto: UpdateIdempotencyKeyDto,
  ) {
    return this.idempotencyKeysService.update(+id, updateIdempotencyKeyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.idempotencyKeysService.remove(+id);
  }
}
