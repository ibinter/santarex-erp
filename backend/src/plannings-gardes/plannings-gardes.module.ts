import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Garde } from './entities/garde.entity';
import { User } from '../users/entities/user.entity';
import { PlanningsGardesService } from './plannings-gardes.service';
import { PlanningsGardesController } from './plannings-gardes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Garde, User])],
  providers: [PlanningsGardesService],
  controllers: [PlanningsGardesController],
  exports: [PlanningsGardesService],
})
export class PlanningsGardesModule {}
