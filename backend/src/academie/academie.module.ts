import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademieController } from './academie.controller';
import { AcademieService } from './academie.service';
import { ParcoursFormation } from './entities/parcours-formation.entity';
import { RessourceFormation } from './entities/ressource-formation.entity';
import { ProgressionFormation } from './entities/progression-formation.entity';

/**
 * Espace Académie / Formation SANTAREX (parcours, ressources, progression).
 * NON ajouté à app.module.ts (câblage géré séparément, comme les autres
 * modules commerciaux récents).
 */
@Module({
  imports: [TypeOrmModule.forFeature([
    ParcoursFormation, RessourceFormation, ProgressionFormation,
  ])],
  controllers: [AcademieController],
  providers: [AcademieService],
  exports: [AcademieService],
})
export class AcademieModule {}
