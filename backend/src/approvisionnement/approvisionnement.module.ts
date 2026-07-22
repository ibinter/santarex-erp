import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fournisseur } from './entities/fournisseur.entity';
import { BonCommande } from './entities/bon-commande.entity';
import { LigneCommande } from './entities/ligne-commande.entity';
import { ApprovisionnementController } from './approvisionnement.controller';
import { ApprovisionnementService } from './approvisionnement.service';

@Module({
  imports: [TypeOrmModule.forFeature([Fournisseur, BonCommande, LigneCommande])],
  controllers: [ApprovisionnementController],
  providers: [ApprovisionnementService],
  exports: [ApprovisionnementService],
})
export class ApprovisionnementModule {}
