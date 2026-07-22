import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaladieDeclarable } from './entities/maladie-declarable.entity';
import { DeclarationSanitaire } from './entities/declaration-sanitaire.entity';
import { DeclarationsSanitairesController } from './declarations-sanitaires.controller';
import { DeclarationsSanitairesService } from './declarations-sanitaires.service';

@Module({
  imports: [TypeOrmModule.forFeature([MaladieDeclarable, DeclarationSanitaire])],
  controllers: [DeclarationsSanitairesController],
  providers: [DeclarationsSanitairesService],
  exports: [DeclarationsSanitairesService],
})
export class DeclarationsSanitairesModule {}
