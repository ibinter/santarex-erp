import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantsController } from './tenants.controller';
import { SettingsController } from './settings.controller';
import { TenantsService } from './tenants.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantsController, SettingsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
