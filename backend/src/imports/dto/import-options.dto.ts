import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Options passées lors de la confirmation d'un import de patients.
 * `doublons` décide du comportement face aux lignes détectées comme
 * doublons (même nom + prénom + date de naissance qu'un patient existant
 * du tenant, ou qu'une autre ligne du même fichier).
 *  - `ignorer` (défaut) : les doublons ne sont pas créés.
 *  - `creer`   : les doublons sont créés malgré tout (nouvel IPP).
 */
export class ImportOptionsDto {
  @ApiPropertyOptional({
    enum: ['ignorer', 'creer'],
    default: 'ignorer',
    description: 'Comportement face aux doublons détectés',
  })
  @IsOptional()
  @IsIn(['ignorer', 'creer'])
  doublons?: 'ignorer' | 'creer';
}
