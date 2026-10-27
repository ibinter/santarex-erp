import { Equals, IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AnnonceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  sujet: string;

  /** Texte brut : lignes vides = paragraphes, lignes « • » ou « - » = puces. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string;
}

export class AnnonceTestDto extends AnnonceDto {
  @IsEmail()
  testA: string;
}

export class AnnonceEnvoiDto extends AnnonceDto {
  /** Garde-fou contre un envoi involontaire : doit valoir exactement « ENVOYER ». */
  @Equals('ENVOYER')
  confirmation: string;
}
