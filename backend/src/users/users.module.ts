import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { LicencesModule } from '../licences/licences.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Tenant]), LicencesModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
