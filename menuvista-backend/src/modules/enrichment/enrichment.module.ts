import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnrichmentService } from './enrichment.service';
import { AppLogger } from '../../common/logger/logger.util';

/**
 * Module NestJS encapsulant le service d'enrichissement culinaire IA par lots.
 */
@Module({
  imports: [ConfigModule],
  providers: [EnrichmentService, AppLogger],
  exports: [EnrichmentService],
})
export class EnrichmentModule {}
