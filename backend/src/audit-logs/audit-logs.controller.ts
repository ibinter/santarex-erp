import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { AuditAction } from './entities/audit-log.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.DIRECTEUR)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Consulter le journal d\'audit' })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'ressource', required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('tenantId') tenantId?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('ressource') ressource?: string,
  ) {
    return this.auditLogsService.findAll(pagination, { tenantId, userId, action, ressource });
  }
}
