import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ImageMatchingService } from './image-matching.service';
import { ImageMatchingQueueService } from './image-matching.queue.service';
import { DatasetModule } from '../dataset/dataset.module';

@Module({
  imports: [
    DatasetModule,
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
  ],
  providers: [ImageMatchingService, ImageMatchingQueueService],
  exports: [ImageMatchingService, ImageMatchingQueueService],
})
export class ImageMatchingModule {}
