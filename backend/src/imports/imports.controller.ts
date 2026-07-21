import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { ImportsService, UploadedImportFile } from './imports.service';
import { ImportOptionsDto } from './dto/import-options.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

const MAX_IMPORT_BYTES = 5 * 1024 * 1024; // 5 Mo — appliqué aussi par Multer

@ApiTags('Imports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.DIRECTEUR, UserRole.SUPERADMIN)
@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Get('patients/modele')
  @ApiOperation({
    summary: 'Télécharger le modèle XLSX d\'import de patients',
    description: 'Renvoie un classeur XLSX avec les colonnes attendues et une feuille d\'instructions.',
  })
  async modelePatients(@Res() res: Response) {
    const buf = await this.importsService.genererModele();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="modele-import-patients.xlsx"',
      'Content-Length': buf.length,
    });
    res.end(buf);
  }

  @Post('patients/preview')
  @ApiOperation({
    summary: 'Prévisualiser un import de patients (aucune écriture)',
    description:
      'Parse le fichier, valide chaque ligne, détecte les doublons (nom + prénom + date de naissance) et renvoie un rapport sans rien enregistrer.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Rapport de prévisualisation' })
  @ApiResponse({ status: 400, description: 'Fichier invalide ou non conforme' })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMPORT_BYTES, files: 1 } }),
  )
  async previewPatients(
    @UploadedFile() file: UploadedImportFile,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Champ "file" manquant dans la requête multipart.');
    }
    return this.importsService.preview(file, tenantId);
  }

  @Post('patients/confirmer')
  @ApiOperation({
    summary: 'Confirmer un import de patients (écriture en base)',
    description:
      'Rejoue la validation puis insère les lignes valides en base (transaction, par lots). L\'option "doublons" (ignorer|creer) décide du sort des doublons.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Résultat de l\'import { crees, ignores, erreurs }' })
  @ApiResponse({ status: 400, description: 'Fichier invalide ou non conforme' })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMPORT_BYTES, files: 1 } }),
  )
  async confirmerPatients(
    @UploadedFile() file: UploadedImportFile,
    @Body() options: ImportOptionsDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Champ "file" manquant dans la requête multipart.');
    }
    return this.importsService.confirmer(
      file,
      tenantId,
      userId,
      options?.doublons ?? 'ignorer',
    );
  }
}
