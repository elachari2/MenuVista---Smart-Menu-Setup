import { Controller, Get, Param } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuPreviewResponseDto } from './dto/menu-preview-response.dto';
import { AppLogger } from '../../common/logger/logger.util';

/**
 * Contrôleur HTTP gérant la consultation des menus structurés et la prévisualisation.
 */
@Controller('menus')
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Endpoint GET /api/v1/menus/:menuId/preview
   * Récupère le menu structuré complet avec ses catégories et plats.
   * Accapte à la fois les UUID BDD et les menus de test de démonstration ("demo-menu-id").
   * @param menuId Identifiant du menu
   * @returns MenuPreviewResponseDto
   */
  @Get(':menuId/preview')
  async getMenuPreview(
    @Param('menuId') menuId: string,
  ): Promise<MenuPreviewResponseDto> {
    const context = 'MenuController';
    this.logger.log(`Requête de prévisualisation reçue pour le menu: ${menuId}`, context);
    return this.menuService.getMenuPreview(menuId);
  }
}
