import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Licence } from './entities/licence.entity';
import { LicencesController } from './licences.controller';
import { LicencesService } from './licences.service';
import { OffresSaasModule } from '../offres-saas/offres-saas.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TypeOrmModule.forFeature([Licence]), OffresSaasModule, TenantsModule],
  controllers: [LicencesController],
  providers: [LicencesService],
  exports: [LicencesService],
})
export class LicencesModule {}
