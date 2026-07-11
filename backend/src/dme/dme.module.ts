import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DmeController } from './dme.controller';
import { DmeService } from './dme.service';
import { Antecedent } from './entities/antecedent.entity';
import { Allergie } from './entities/allergie.entity';
import { DocumentMedical } from './entities/document-medical.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Antecedent, Allergie, DocumentMedical])],
  controllers: [DmeController],
  providers: [DmeService],
  exports: [DmeService],
})
export class DmeModule {}
