import { Module } from '@nestjs/common';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';
import { TenantsModule } from '../tenants/tenants.module';
import { LicencesModule } from '../licences/licences.module';
import { OffresSaasModule } from '../offres-saas/offres-saas.module';

@Module({
  imports: [TenantsModule, LicencesModule, OffresSaasModule],
  controllers: [SuperadminController],
  providers: [SuperadminService],
})
export class SuperadminModule {}
