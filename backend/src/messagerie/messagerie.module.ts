import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagerieController } from './messagerie.controller';
import { MessagerieService } from './messagerie.service';
import { Conversation } from './entities/conversation.entity';
import { MessageInterne } from './entities/message-interne.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, MessageInterne, User])],
  controllers: [MessagerieController],
  providers: [MessagerieService],
  exports: [MessagerieService],
})
export class MessagerieModule {}
