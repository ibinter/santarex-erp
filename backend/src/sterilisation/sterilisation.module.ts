import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotSterilisation } from './entities/lot-sterilisation.entity';
import { Instrument } from './entities/instrument.entity';
import { SterilisationService } from './sterilisation.service';
import { SterilisationController } from './sterilisation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LotSterilisation, Instrument])],
  providers: [SterilisationService],
  controllers: [SterilisationController],
  exports: [SterilisationService],
})
export class SterilisationModule {}
