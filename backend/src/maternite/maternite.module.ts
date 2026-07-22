import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DossierGrossesse } from './entities/dossier-grossesse.entity';
import { ConsultationPrenatale } from './entities/consultation-prenatale.entity';
import { Accouchement } from './entities/accouchement.entity';
import { SurveillanceTravail } from './entities/surveillance-travail.entity';
import { SuiviPostNatal } from './entities/suivi-postnatal.entity';
import { Patient } from '../patients/entities/patient.entity';
import { MaterniteController } from './maternite.controller';
import { MaterniteService } from './maternite.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DossierGrossesse,
      ConsultationPrenatale,
      Accouchement,
      SurveillanceTravail,
      SuiviPostNatal,
      Patient,
    ]),
  ],
  controllers: [MaterniteController],
  providers: [MaterniteService],
  exports: [MaterniteService],
})
export class MaterniteModule {}
