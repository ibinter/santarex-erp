import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { Prospect } from './entities/prospect.entity';
import { DemandeDemo } from './entities/demande-demo.entity';

/**
 * CRM éditeur IBIG SOFT — prospects & pipeline de démonstrations.
 * MailModule est @Global : MailService est injectable sans import explicite.
 * NON ajouté à app.module.ts (câblage géré séparément).
 */
@Module({
  imports: [TypeOrmModule.forFeature([Prospect, DemandeDemo])],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
