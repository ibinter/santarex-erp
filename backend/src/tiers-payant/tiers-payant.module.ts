import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BordereauTiersPayant } from './entities/bordereau-tiers-payant.entity';
import { LigneBordereau } from './entities/ligne-bordereau.entity';
import { Assureur } from '../prise-en-charge/entities/assureur.entity';
import { TiersPayantController } from './tiers-payant.controller';
import { TiersPayantService } from './tiers-payant.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BordereauTiersPayant, LigneBordereau, Assureur]),
  ],
  controllers: [TiersPayantController],
  providers: [TiersPayantService],
  exports: [TiersPayantService],
})
export class TiersPayantModule {}
