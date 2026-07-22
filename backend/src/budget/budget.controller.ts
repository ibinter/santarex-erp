import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto, CreateLigneBudgetDto } from './dto/create-budget.dto';
import {
  UpdateBudgetDto,
  UpdateLigneBudgetDto,
  SaisirRealiseDto,
} from './dto/update-budget.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StatutBudget, TypeBudget } from './entities/budget.entity';

@Controller('budget')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
// Contrôle de gestion : lecture pour la direction et l'administration,
// mutations réservées aux mêmes profils (fonction financière).
@Roles(UserRole.ADMIN, UserRole.DIRECTEUR, UserRole.SUPERADMIN)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  // ── Tableau de bord & stats (avant :id pour éviter la collision de route) ─
  @Get('tableau-bord')
  getTableauBord(@Request() req, @Query('exercice') exercice?: string) {
    return this.budgetService.getTableauBord(
      req.user.tenantId,
      exercice ? Number(exercice) : undefined,
    );
  }

  @Get('stats')
  getStats(@Request() req, @Query('exercice') exercice?: string) {
    return this.budgetService.getStats(
      req.user.tenantId,
      exercice ? Number(exercice) : undefined,
    );
  }

  // ── CRUD budgets ─────────────────────────────────────────────────────────
  @Get()
  findAll(
    @Request() req,
    @Query('exercice') exercice?: string,
    @Query('type') type?: TypeBudget,
    @Query('statut') statut?: StatutBudget,
    @Query('service') service?: string,
  ) {
    return this.budgetService.findAll(req.user.tenantId, {
      exercice: exercice ? Number(exercice) : undefined,
      type,
      statut,
      service,
    });
  }

  @Post()
  create(@Body() dto: CreateBudgetDto, @Request() req) {
    return this.budgetService.createBudget(dto, req.user.tenantId, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.budgetService.findOne(id, req.user.tenantId);
  }

  @Get(':id/synthese')
  getSynthese(@Param('id') id: string, @Request() req) {
    return this.budgetService.getSynthese(id, req.user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBudgetDto, @Request() req) {
    return this.budgetService.updateBudget(id, dto, req.user.tenantId);
  }

  @Patch(':id/valider')
  valider(@Param('id') id: string, @Request() req) {
    return this.budgetService.valider(id, req.user.tenantId);
  }

  @Patch(':id/cloturer')
  cloturer(@Param('id') id: string, @Request() req) {
    return this.budgetService.cloturer(id, req.user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.budgetService.removeBudget(id, req.user.tenantId);
  }

  // ── Lignes budgétaires ───────────────────────────────────────────────────
  @Get(':id/lignes')
  getLignes(@Param('id') id: string, @Request() req) {
    return this.budgetService.getLignes(id, req.user.tenantId);
  }

  @Post(':id/lignes')
  addLigne(
    @Param('id') id: string,
    @Body() dto: CreateLigneBudgetDto,
    @Request() req,
  ) {
    return this.budgetService.addLigne(id, dto, req.user.tenantId);
  }

  @Patch(':id/lignes/:ligneId')
  updateLigne(
    @Param('id') id: string,
    @Param('ligneId') ligneId: string,
    @Body() dto: UpdateLigneBudgetDto,
    @Request() req,
  ) {
    return this.budgetService.updateLigne(id, ligneId, dto, req.user.tenantId);
  }

  @Delete(':id/lignes/:ligneId')
  removeLigne(
    @Param('id') id: string,
    @Param('ligneId') ligneId: string,
    @Request() req,
  ) {
    return this.budgetService.removeLigne(id, ligneId, req.user.tenantId);
  }

  // ── Saisie du réalisé (global ou mensuel) ───────────────────────────────
  @Patch(':id/lignes/:ligneId/realise')
  saisirRealise(
    @Param('id') id: string,
    @Param('ligneId') ligneId: string,
    @Body() dto: SaisirRealiseDto,
    @Request() req,
  ) {
    return this.budgetService.saisirRealise(id, ligneId, dto, req.user.tenantId);
  }

  @Get(':id/lignes/:ligneId/suivis')
  getSuivis(
    @Param('ligneId') ligneId: string,
    @Request() req,
  ) {
    return this.budgetService.getSuivis(ligneId, req.user.tenantId);
  }
}
