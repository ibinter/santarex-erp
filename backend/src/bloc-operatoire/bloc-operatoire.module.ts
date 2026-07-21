import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalleOperation } from './entities/salle-operation.entity';
import { Intervention } from './entities/intervention.entity';
import { BlocOperatoireService } from './bloc-operatoire.service';
import { BlocOperatoireController } from './bloc-operatoire.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SalleOperation, Intervention])],
  providers: [BlocOperatoireService],
  controllers: [BlocOperatoireController],
  exports: [BlocOperatoireService],
})
export class BlocOperatoireModule {}
