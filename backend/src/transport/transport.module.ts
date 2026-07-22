import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicule } from './entities/vehicule.entity';
import { MissionTransport } from './entities/mission-transport.entity';
import { Patient } from '../patients/entities/patient.entity';
import { TransportService } from './transport.service';
import { TransportController } from './transport.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicule, MissionTransport, Patient])],
  providers: [TransportService],
  controllers: [TransportController],
  exports: [TransportService],
})
export class TransportModule {}
