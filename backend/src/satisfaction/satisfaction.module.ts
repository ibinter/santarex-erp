import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Questionnaire } from './entities/questionnaire.entity';
import { ReponseSatisfaction } from './entities/reponse-satisfaction.entity';
import { SatisfactionController } from './satisfaction.controller';
import { SatisfactionService } from './satisfaction.service';

@Module({
  imports: [TypeOrmModule.forFeature([Questionnaire, ReponseSatisfaction])],
  controllers: [SatisfactionController],
  providers: [SatisfactionService],
  exports: [SatisfactionService],
})
export class SatisfactionModule {}
