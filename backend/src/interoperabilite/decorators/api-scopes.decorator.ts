import { SetMetadata } from '@nestjs/common';
import { API_SCOPES_KEY } from '../guards/api-key.guard';

/** Exige que la clé API porte TOUTES les portées listées. */
export const ApiScopes = (...scopes: string[]) => SetMetadata(API_SCOPES_KEY, scopes);
