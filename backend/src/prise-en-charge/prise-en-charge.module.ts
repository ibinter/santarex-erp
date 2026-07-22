import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assureur } from './entities/assureur.entity';
import { BonPriseEnCharge } from './entities/bon-prise-en-charge.entity';
import { Patient } from '../patients/entities/patient.entity';
import { PriseEnChargeController } from './prise-en-charge.controller';
import { PriseEnChargeService } from './prise-en-charge.service';

@Module({
  imports: [TypeOrmModule.forFeature([Assureur, BonPriseEnCharge, Patient])],
  controllers: [PriseEnChargeController],
  providers: [PriseEnChargeService],
  exports: [PriseEnChargeService],
})
export class PriseEnChargeModule {}
