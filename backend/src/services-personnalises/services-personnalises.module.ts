import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicePersonnalise } from './entities/service-personnalise.entity';
import { EnregistrementService } from './entities/enregistrement-service.entity';
import { ServicesPersonnalisesController } from './services-personnalises.controller';
import { ServicesPersonnalisesService } from './services-personnalises.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServicePersonnalise, EnregistrementService]),
  ],
  controllers: [ServicesPersonnalisesController],
  providers: [ServicesPersonnalisesService],
  exports: [ServicesPersonnalisesService],
})
export class ServicesPersonnalisesModule {}
