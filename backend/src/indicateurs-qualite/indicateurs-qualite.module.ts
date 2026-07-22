import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndicateurQualite } from './entities/indicateur-qualite.entity';
import { MesureIndicateur } from './entities/mesure-indicateur.entity';
import { CritereAccreditation } from './entities/critere-accreditation.entity';
import { IndicateursQualiteController } from './indicateurs-qualite.controller';
import { IndicateursQualiteService } from './indicateurs-qualite.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IndicateurQualite,
      MesureIndicateur,
      CritereAccreditation,
    ]),
  ],
  controllers: [IndicateursQualiteController],
  providers: [IndicateursQualiteService],
  exports: [IndicateursQualiteService],
})
export class IndicateursQualiteModule {}
