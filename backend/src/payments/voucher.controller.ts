// ════════════════════════════════════════════════════════════════════════════
//  VoucherController — endpoints codes prépayés.
//   • Admin (admin/superadmin) : génération, listing, export CSV, désactivation.
//   • Client (JWT) : redemption / activation immédiate.
// ════════════════════════════════════════════════════════════════════════════
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

import { VoucherService, VoucherFilter } from './voucher.service';
import { GenerateVouchersDto, RedeemVoucherDto } from './dto/voucher.dto';
import { VoucherStatus } from './payments.enums';

// ──────────────────────────────────────────────────────────────────────────
//  ADMIN
// ──────────────────────────────────────────────────────────────────────────
@ApiTags('Paiements — Vouchers (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
@Controller('admin/payments/vouchers')
export class VoucherController {
  constructor(private readonly vouchers: VoucherService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Générer un lot de codes prépayés uniques' })
  generate(@Body() dto: GenerateVouchersDto, @CurrentUser('id') adminId: string) {
    return this.vouchers.generateBatch(dto, adminId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les codes prépayés (filtres facultatifs)' })
  @ApiQuery({ name: 'batchId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: VoucherStatus })
  @ApiQuery({ name: 'offerCode', required: false })
  @ApiQuery({ name: 'resellerRef', required: false })
  list(
    @Query('batchId') batchId?: string,
    @Query('status') status?: VoucherStatus,
    @Query('offerCode') offerCode?: string,
    @Query('resellerRef') resellerRef?: string,
  ) {
    const filter: VoucherFilter = { batchId, status, offerCode, resellerRef };
    return this.vouchers.list(filter);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exporter un lot au format CSV (revendeurs)' })
  @ApiQuery({ name: 'batchId', required: true })
  async export(
    @Query('batchId') batchId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    const csv = await this.vouchers.exportCsv(batchId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="vouchers-${batchId}.csv"`,
    );
    return csv;
  }

  @Patch(':code/disable')
  @ApiOperation({ summary: 'Désactiver un code prépayé disponible' })
  disable(@Param('code') code: string, @CurrentUser('id') adminId: string) {
    return this.vouchers.disable(code, adminId);
  }
}

// ──────────────────────────────────────────────────────────────────────────
//  CLIENT
// ──────────────────────────────────────────────────────────────────────────
@ApiTags('Paiements — Vouchers (Client)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments/vouchers')
export class VoucherClientController {
  constructor(private readonly vouchers: VoucherService) {}

  @Post('redeem')
  @ApiOperation({ summary: 'Activer un code prépayé (activation immédiate)' })
  redeem(@Body() dto: RedeemVoucherDto, @CurrentUser('tenantId') tenantId: string) {
    return this.vouchers.redeem(dto.code, tenantId);
  }
}
