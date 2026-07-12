import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PaiementsSaasController } from './paiements-saas.controller';
import { PaiementsSaasService } from './paiements-saas.service';
import { PaiementSaas } from './entities/paiement-saas.entity';
import { LicencesModule } from '../licences/licences.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaiementSaas]),
    HttpModule,
    LicencesModule,
  ],
  controllers: [PaiementsSaasController],
  providers: [PaiementsSaasService],
  exports: [PaiementsSaasService],
})
export class PaiementsSaasModule {}
