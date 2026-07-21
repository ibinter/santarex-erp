import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * Le statut est normalisé côté service (accepte `EN_COURS`, `en_cours`…), donc
 * on valide simplement une chaîne pour rester tolérant vis-à-vis du frontend.
 */
export class ChangerStatutImagerieDto {
  @ApiProperty({
    description: 'Nouveau statut',
    example: 'EN_COURS',
    enum: ['EN_ATTENTE', 'EN_COURS', 'TERMINE', 'VALIDE', 'ANNULE'],
  })
  @IsString()
  statut: string;
}
