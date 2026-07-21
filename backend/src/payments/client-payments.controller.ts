import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

import { ManualPaymentService, TenantContext } from './manual-payment.service';
import { PaymentConfigService } from './payments-config.service';
import { ProofStorageService, UploadedProofFile } from './proof-storage.service';
import {
  CreateTransactionDto,
  SubmitProofRefDto,
  ValidateTransactionDto,
  RejectTransactionDto,
} from './dto/client.dto';

const MAX_PROOF_BYTES = 5 * 1024 * 1024;

interface AuthedRequest {
  user: { id: string; tenantId: string; tenantSlug?: string; role?: UserRole };
}

@ApiTags('Paiements')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class ClientPaymentsController {
  constructor(
    private readonly manualPayments: ManualPaymentService,
    private readonly paymentConfig: PaymentConfigService,
    private readonly proofStorage: ProofStorageService,
  ) {}

  private tenantOf(req: AuthedRequest): TenantContext {
    return {
      tenantId: req.user.tenantId,
      tenantSlug: req.user.tenantSlug,
      userId: req.user.id,
    };
  }

  // ── Client ────────────────────────────────────────────────────────────────

  @Get('methods')
  @ApiOperation({ summary: 'Lister les moyens de paiement disponibles pour le client' })
  getMethods(
    @Query('country') country?: string,
    @Query('offerCode') offerCode?: string,
  ) {
    return this.paymentConfig.getClientMethods(country, offerCode);
  }

  @Post('transactions')
  @ApiOperation({ summary: "Créer une commande de paiement d'abonnement" })
  createTransaction(@Req() req: AuthedRequest, @Body() dto: CreateTransactionDto) {
    return this.manualPayments.createTransaction(dto, this.tenantOf(req));
  }

  @Post('transactions/:ref/proof')
  @ApiOperation({ summary: 'Téléverser une preuve de paiement (image ou PDF)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_PROOF_BYTES, files: 1 } }),
  )
  submitProof(
    @Req() req: AuthedRequest,
    @Param('ref') ref: string,
    @UploadedFile() file: UploadedProofFile,
  ) {
    if (!file) {
      throw new BadRequestException('Champ "file" manquant dans la requête multipart.');
    }
    return this.manualPayments.submitProof(ref, file, req.user.id);
  }

  @Post('transactions/:ref/reference')
  @ApiOperation({
    summary: 'Enregistrer une référence client (MTCN, hash crypto, n° chèque, code reçu)',
  })
  submitReference(@Param('ref') ref: string, @Body() dto: SubmitProofRefDto) {
    return this.manualPayments.submitReference(ref, dto.clientReference);
  }

  @Get('transactions/mine')
  @ApiOperation({ summary: 'Lister mes transactions de paiement' })
  listMine(@Req() req: AuthedRequest) {
    return this.manualPayments.listByTenant(req.user.tenantId);
  }

  // ── Admin (validation manuelle) ────────────────────────────────────────────

  @Get('admin/transactions/review')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Lister les transactions en attente de validation' })
  listForReview() {
    return this.manualPayments.listForReview();
  }

  @Patch('admin/transactions/:ref/validate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Valider une transaction (active la licence)' })
  validate(
    @Req() req: AuthedRequest,
    @Param('ref') ref: string,
    @Body() dto: ValidateTransactionDto,
  ) {
    return this.manualPayments.adminValidate(ref, req.user.id, dto?.notes);
  }

  @Patch('admin/transactions/:ref/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Rejeter une transaction' })
  reject(
    @Req() req: AuthedRequest,
    @Param('ref') ref: string,
    @Body() dto: RejectTransactionDto,
  ) {
    return this.manualPayments.adminReject(ref, req.user.id, dto.reason);
  }
}
