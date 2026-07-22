import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollecteDechets } from './entities/collecte-dechets.entity';
import { EnlevementDechets } from './entities/enlevement-dechets.entity';
import { DechetsMedicauxController } from './dechets-medicaux.controller';
import { DechetsMedicauxService } from './dechets-medicaux.service';

@Module({
  imports: [TypeOrmModule.forFeature([CollecteDechets, EnlevementDechets])],
  controllers: [DechetsMedicauxController],
  providers: [DechetsMedicauxService],
  exports: [DechetsMedicauxService],
})
export class DechetsMedicauxModule {}
