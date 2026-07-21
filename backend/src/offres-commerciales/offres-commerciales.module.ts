import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffresCommercialesController } from './offres-commerciales.controller';
import { OffresCommercialesService } from './offres-commerciales.service';
import { OffreCommerciale } from './entities/offre-commerciale.entity';

/**
 * Module des offres commerciales (DEVIS personnalisés).
 * MailService est fourni globalement par le `MailModule` (@Global), donc pas
 * besoin de l'importer ici. NON ajouté à `app.module.ts` (câblage réservé).
 */
@Module({
  imports: [TypeOrmModule.forFeature([OffreCommerciale])],
  controllers: [OffresCommercialesController],
  providers: [OffresCommercialesService],
  exports: [OffresCommercialesService],
})
export class OffresCommercialesModule {}
