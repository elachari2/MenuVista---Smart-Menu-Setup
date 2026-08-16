import { Module } from '@nestjs/common';
import { StructurationService } from './structuration.service';
import { ChunkService } from './chunk.service';
import { AppLogger } from '../../common/logger/logger.util';

/**
 * Module Structuration offrant StructurationService et ChunkService.
 */
@Module({
  providers: [StructurationService, ChunkService, AppLogger],
  exports: [StructurationService, ChunkService],
})
export class StructurationModule {}
