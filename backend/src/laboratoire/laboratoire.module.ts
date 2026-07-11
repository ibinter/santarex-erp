import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeAnalyse } from './entities/type-analyse.entity';
import { DemandeAnalyse } from './entities/demande-analyse.entity';
import { ResultatAnalyse } from './entities/resultat-analyse.entity';
import { LaboratoireController } from './laboratoire.controller';
import { LaboratoireService } from './laboratoire.service';

@Module({
  imports: [TypeOrmModule.forFeature([TypeAnalyse, DemandeAnalyse, ResultatAnalyse])],
  controllers: [LaboratoireController],
  providers: [LaboratoireService],
  exports: [LaboratoireService],
})
export class LaboratoireModule {}
