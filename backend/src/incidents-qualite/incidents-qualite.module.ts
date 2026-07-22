import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentQualite } from './entities/incident-qualite.entity';
import { IncidentsQualiteController } from './incidents-qualite.controller';
import { IncidentsQualiteService } from './incidents-qualite.service';

@Module({
  imports: [TypeOrmModule.forFeature([IncidentQualite])],
  controllers: [IncidentsQualiteController],
  providers: [IncidentsQualiteService],
  exports: [IncidentsQualiteService],
})
export class IncidentsQualiteModule {}
