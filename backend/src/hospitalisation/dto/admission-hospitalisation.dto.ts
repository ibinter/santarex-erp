import { IsEnum, IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceHospitalisation } from '../entities/lit.entity';
import { TypeSejour } from '../entities/sejour.entity';

export class AdmissionHospitalisationDto {
  @ApiProperty({ description: 'UUID du patient à admettre' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'UUID du lit assigné' })
  @IsUUID()
  litId: string;

  @ApiProperty({ description: 'UUID du médecin référent' })
  @IsUUID()
  medecinReferentId: string;

  @ApiProperty({ enum: ServiceHospitalisation, description: 'Service d\'hospitalisation' })
  @IsEnum(ServiceHospitalisation)
  service: ServiceHospitalisation;

  @ApiProperty({ enum: TypeSejour, description: 'Type d\'admission' })
  @IsEnum(TypeSejour)
  type: TypeSejour;

  @ApiPropertyOptional({ description: 'Date et heure d\'admission (défaut: maintenant)' })
  @IsOptional()
  @IsDateString()
  dateHeureAdmission?: string;

  @ApiProperty({ description: 'Diagnostic à l\'entrée' })
  @IsString()
  diagnosticEntree: string;
}
