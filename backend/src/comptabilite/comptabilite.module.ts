import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompteComptable } from './entities/compte-comptable.entity';
import { EcritureComptable } from './entities/ecriture-comptable.entity';
import { LigneEcriture } from './entities/ligne-ecriture.entity';
import { ComptabiliteService } from './comptabilite.service';
import { ComptabiliteController } from './comptabilite.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompteComptable,
      EcritureComptable,
      LigneEcriture,
    ]),
  ],
  providers: [ComptabiliteService],
  controllers: [ComptabiliteController],
  exports: [ComptabiliteService],
})
export class ComptabiliteModule {}
