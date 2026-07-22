import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriseEnChargeHAD } from './entities/prise-en-charge-had.entity';
import { VisiteHAD } from './entities/visite-had.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { HadService } from './had.service';
import { HadController } from './had.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PriseEnChargeHAD, VisiteHAD, Patient, User])],
  providers: [HadService],
  controllers: [HadController],
  exports: [HadService],
})
export class HadModule {}
