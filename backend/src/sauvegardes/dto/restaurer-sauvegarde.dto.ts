import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * La restauration est une opération DESTRUCTRICE. Pour l'exécuter, l'appelant
 * doit renvoyer explicitement le jeton de confirmation fort attendu par le
 * service (voir SauvegardesService.CONFIRMATION_TOKEN). Toute autre valeur
 * fait échouer la requête avant la moindre action sur la base.
 */
export class RestaurerSauvegardeDto {
  @ApiProperty({
    description:
      'Jeton de confirmation fort. Doit valoir exactement "RESTAURER-DEFINITIVEMENT".',
    example: 'RESTAURER-DEFINITIVEMENT',
  })
  @IsString()
  @IsNotEmpty()
  confirmationText: string;
}
