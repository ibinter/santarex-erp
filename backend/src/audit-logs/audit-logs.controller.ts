import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
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
  findAll(@Query() query: ListAuditLogsQueryDto, @Request() req) {
    // Un administrateur d'établissement ne voit que le journal de SON établissement ; seul le superadmin peut filtrer.
    const tenantId = req.user?.role === UserRole.SUPERADMIN ? query.tenantId : req.user?.tenantId;
    const { userId, action, ressource } = query;
    return this.auditLogsService.findAll(query, { tenantId, userId, action, ressource });
  }
}
