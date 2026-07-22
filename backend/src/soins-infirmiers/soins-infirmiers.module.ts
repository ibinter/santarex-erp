import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransmissionCiblee } from './entities/transmission-ciblee.entity';
import { PlanSoins } from './entities/plan-soins.entity';
import { ActeSoin } from './entities/acte-soin.entity';
import { EvaluationDouleur } from './entities/evaluation-douleur.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { SoinsInfirmiersController } from './soins-infirmiers.controller';
import { SoinsInfirmiersService } from './soins-infirmiers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransmissionCiblee,
      PlanSoins,
      ActeSoin,
      EvaluationDouleur,
      Patient,
      User,
    ]),
  ],
  controllers: [SoinsInfirmiersController],
  providers: [SoinsInfirmiersService],
  exports: [SoinsInfirmiersService],
})
export class SoinsInfirmiersModule {}
