import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyTwoFactorDto {
  @IsString()
  @IsNotEmpty()
  challengeToken: string;

  /** Code à 6 chiffres de l'application, ou code de secours (ABCDE-12345). */
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  code: string;
}

export class EnableTwoFactorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  code: string;
}

export class DisableTwoFactorDto {
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  code: string;
}
