import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Site } from './entities/site.entity';
import { AffectationSite } from './entities/affectation-site.entity';
import { SitesService } from './sites.service';
import { SitesController } from './sites.controller';

/**
 * Module GESTION MULTI-SITES : gère les sites/antennes d'un même établissement
 * (tenant) et l'affectation du personnel à ces sites. Le SITE est une dimension
 * supplémentaire À L'INTÉRIEUR du multi-tenant existant (ne le refond pas).
 *
 * TODO (filtrage métier par site — à faire plus tard, sans toucher aux autres
 * modules maintenant) : pour scoper patients / stocks / factures par site,
 * ajouter une colonne OPTIONNELLE `siteId` (nullable, indexée) aux entités
 * concernées (ex. Patient, MouvementStock, Facture), exposer un filtre
 * `?siteId=` sur leurs endpoints, et joindre `site_affectations` pour restreindre
 * automatiquement les données visibles à l'utilisateur selon ses sites affectés.
 * Ne rien changer maintenant : garder la portée limitée au module `sites`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Site, AffectationSite])],
  controllers: [SitesController],
  providers: [SitesService],
  exports: [SitesService],
})
export class SitesModule {}
