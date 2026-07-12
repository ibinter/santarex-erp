import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Recherche')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Recherche globale (patients, consultations, factures, médicaments)' })
  @ApiQuery({ name: 'q', description: 'Terme de recherche (min 2 caractères)' })
  search(@Query('q') q: string, @CurrentUser() user: any) {
    return this.searchService.search(q?.trim(), user.tenantId);
  }
}
