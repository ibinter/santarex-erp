import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipement } from './entities/equipement.entity';
import { InterventionMaintenance } from './entities/intervention-maintenance.entity';
import { EquipementsController } from './equipements.controller';
import { EquipementsService } from './equipements.service';

@Module({
  imports: [TypeOrmModule.forFeature([Equipement, InterventionMaintenance])],
  controllers: [EquipementsController],
  providers: [EquipementsService],
  exports: [EquipementsService],
})
export class EquipementsModule {}
