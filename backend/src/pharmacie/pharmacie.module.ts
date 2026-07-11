import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medicament } from './entities/medicament.entity';
import { StockMedicament } from './entities/stock-medicament.entity';
import { MouvementStock } from './entities/mouvement-stock.entity';
import { PharmacieController } from './pharmacie.controller';
import { PharmacieService } from './pharmacie.service';

@Module({
  imports: [TypeOrmModule.forFeature([Medicament, StockMedicament, MouvementStock])],
  controllers: [PharmacieController],
  providers: [PharmacieService],
  exports: [PharmacieService],
})
export class PharmacieModule {}
