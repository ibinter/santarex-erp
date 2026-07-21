import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DocumentVerifiable } from './entities/document-verifiable.entity';
import { VerificationService } from './verification.service';
import {
  VerificationController,
  PublicVerificationController,
} from './verification.controller';

/**
 * VerificationModule — vérification publique de documents (facture, reçu,
 * ordonnance, attestation) par QR code + empreinte SHA-256. Table `doc_verifications`.
 *
 * NE PAS ajouter à app.module.ts ici — l'intégration est faite manuellement.
 */
@Module({
  imports: [TypeOrmModule.forFeature([DocumentVerifiable])],
  controllers: [VerificationController, PublicVerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
