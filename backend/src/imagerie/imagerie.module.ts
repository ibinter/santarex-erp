import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeExamenImagerie } from './entities/type-examen-imagerie.entity';
import { DemandeImagerie } from './entities/demande-imagerie.entity';
import { ResultatImagerie } from './entities/resultat-imagerie.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { ImagerieController } from './imagerie.controller';
import { ImagerieService } from './imagerie.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TypeExamenImagerie,
      DemandeImagerie,
      ResultatImagerie,
      Patient,
      User,
    ]),
  ],
  controllers: [ImagerieController],
  providers: [ImagerieService],
  exports: [ImagerieService],
})
export class ImagerieModule {}
