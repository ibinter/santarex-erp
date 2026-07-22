import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PocheSang } from './entities/poche-sang.entity';
import { Transfusion } from './entities/transfusion.entity';
import { BanqueSangController } from './banque-sang.controller';
import { BanqueSangService } from './banque-sang.service';

@Module({
  imports: [TypeOrmModule.forFeature([PocheSang, Transfusion])],
  controllers: [BanqueSangController],
  providers: [BanqueSangService],
  exports: [BanqueSangService],
})
export class BanqueSangModule {}
