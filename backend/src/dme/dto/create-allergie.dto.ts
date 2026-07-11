import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { TypeAllergie, SeveriteAllergie } from '../entities/allergie.entity';

export class CreateAllergieDto {
  @IsString()
  substance: string;

  @IsEnum(TypeAllergie)
  type: TypeAllergie;

  @IsString()
  reaction: string;

  @IsEnum(SeveriteAllergie)
  severite: SeveriteAllergie;

  @IsOptional()
  @IsBoolean()
  estActive?: boolean;
}
