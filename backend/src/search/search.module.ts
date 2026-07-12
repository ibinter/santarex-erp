import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Patient } from '../patients/entities/patient.entity';
import { Medicament } from '../pharmacie/entities/medicament.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, Medicament])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
