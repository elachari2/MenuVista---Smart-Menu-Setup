import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { Menu } from './entities/menu.entity';
import { Categorie } from './entities/categorie.entity';
import { Plat } from './entities/plat.entity';
import { MenuUploadJob } from './entities/menu-upload-job.entity';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { AppLogger } from '../../common/logger/logger.util';

/**
 * Module Menu gérant la persistance et les endpoints des menus, restaurants, catégories et plats.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Restaurant,
      Menu,
      Categorie,
      Plat,
      MenuUploadJob,
    ]),
  ],
  controllers: [MenuController],
  providers: [MenuService, AppLogger],
  exports: [TypeOrmModule, MenuService],
})
export class MenuModule {}
