import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevisPatient } from './entities/devis-patient.entity';
import { LigneDevis } from './entities/ligne-devis.entity';
import { DevisService } from './devis.service';
import { DevisController } from './devis.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DevisPatient, LigneDevis])],
  providers: [DevisService],
  controllers: [DevisController],
  exports: [DevisService],
})
export class DevisModule {}
