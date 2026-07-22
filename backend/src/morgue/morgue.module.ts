import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deces } from './entities/deces.entity';
import { CasierMorgue } from './entities/casier-morgue.entity';
import { SejourMorgue } from './entities/sejour-morgue.entity';
import { Patient } from '../patients/entities/patient.entity';
import { MorgueService } from './morgue.service';
import { MorgueController } from './morgue.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Deces, CasierMorgue, SejourMorgue, Patient])],
  providers: [MorgueService],
  controllers: [MorgueController],
  exports: [MorgueService],
})
export class MorgueModule {}
