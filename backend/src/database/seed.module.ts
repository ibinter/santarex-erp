import { Module } from '@nestjs/common';
import { SeedService, SeedController } from './seed.service';

@Module({
  providers: [SeedService],
  controllers: [SeedController],
  exports: [SeedService],
})
export class SeedModule {}
