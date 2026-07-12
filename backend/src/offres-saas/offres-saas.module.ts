import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffreSaas } from './entities/offre-saas.entity';
import { OffresSaasController } from './offres-saas.controller';
import { OffresSaasService } from './offres-saas.service';

@Module({
  imports: [TypeOrmModule.forFeature([OffreSaas])],
  controllers: [OffresSaasController],
  providers: [OffresSaasService],
  exports: [OffresSaasService],
})
export class OffresSaasModule {}
