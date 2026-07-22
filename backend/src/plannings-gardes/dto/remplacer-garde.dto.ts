import { IsString, IsOptional } from 'class-validator';

export class RemplacerGardeDto {
  /** Personnel remplaçant (userId ou employeRef). */
  @IsString()
  remplacantRef: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
