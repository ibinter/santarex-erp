import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employe } from './entities/employe.entity';
import { Conge } from './entities/conge.entity';
import { BulletinPaie } from './entities/bulletin-paie.entity';
import { RhService } from './rh.service';
import { RhController } from './rh.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Employe, Conge, BulletinPaie])],
  providers: [RhService],
  controllers: [RhController],
  exports: [RhService],
})
export class RhModule {}
