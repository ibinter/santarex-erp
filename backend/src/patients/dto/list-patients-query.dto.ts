import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PatientSexe, PatientStatut } from '../entities/patient.entity';

/**
 * Paramètres de la liste des patients. L'écran « Patients » et le Dossier médical envoient la recherche (q),
 * le statut et le sexe : sans ces champs ici, le serveur répondait 400 dès qu'on tapait une recherche.
 */
export class ListPatientsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Recherche : nom, prénom, téléphone ou IPP' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: PatientStatut, description: 'Statut du patient (défaut : actif)' })
  @IsOptional()
  @IsEnum(PatientStatut)
  statut?: PatientStatut;

  @ApiPropertyOptional({ enum: PatientSexe })
  @IsOptional()
  @IsEnum(PatientSexe)
  sexe?: PatientSexe;
}
