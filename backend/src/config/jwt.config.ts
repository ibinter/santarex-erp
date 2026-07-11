import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'santarex_jwt_secret_change_in_production',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'santarex_refresh_secret_change_in_production',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
}));
