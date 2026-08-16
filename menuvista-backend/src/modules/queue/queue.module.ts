import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { ImageMatchingProcessor } from './image-matching.processor';
import { ImageMatchingModule } from '../image-matching/image-matching.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'image-matching',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      },
    }),
    ImageMatchingModule,
  ],
  providers: [QueueService, ImageMatchingProcessor],
  exports: [QueueService],
})
export class QueueModule {}
