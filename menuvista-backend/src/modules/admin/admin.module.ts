import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ImageMatchingModule } from '../image-matching/image-matching.module';
import { DatasetModule } from '../dataset/dataset.module';
import { MenuModule } from '../menu/menu.module';

@Module({
  imports: [ImageMatchingModule, DatasetModule, MenuModule],
  controllers: [AdminController],
})
export class AdminModule {}
