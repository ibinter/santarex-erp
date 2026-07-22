import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { GroupeABO, Rhesus } from '../entities/poche-sang.entity';

export class CreateTransfusionDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty()
  @IsString()
  pocheId: string;

  @ApiProperty({ enum: GroupeABO })
  @IsEnum(GroupeABO)
  groupePatient: GroupeABO;

  @ApiProperty({ enum: Rhesus })
  @IsEnum(Rhesus)
  rhesusPatient: Rhesus;

  @ApiPropertyOptional({ description: 'Identifiant du médecin responsable' })
  @IsOptional()
  @IsString()
  medecin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  indication?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiPropertyOptional({
    description:
      'Forcer la transfusion malgré une incompatibilité détectée (décision médicale explicite)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  forcer?: boolean;
}

export class QueryPochesCompatiblesDto {
  @ApiProperty({ enum: GroupeABO })
  @IsEnum(GroupeABO)
  groupe: GroupeABO;

  @ApiProperty({ enum: Rhesus })
  @IsEnum(Rhesus)
  rhesus: Rhesus;
}
