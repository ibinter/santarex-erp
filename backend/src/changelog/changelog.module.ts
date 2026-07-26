import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VersionErp } from './entities/version-erp.entity';
import { ChangelogService } from './changelog.service';
import { ChangelogController } from './changelog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VersionErp])],
  providers: [ChangelogService],
  controllers: [ChangelogController],
  exports: [ChangelogService],
})
export class ChangelogModule {}
