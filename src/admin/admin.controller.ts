import { Controller, Get, UseGuards, Query, Request, Param } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from 'src/users/guard/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Admins')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get()
  @UseGuards(AuthGuard)
  async getDashboard(@Query('filtro') filtro: string) {
    return await this.adminService.getDashboardStats(filtro);
  }

  @Get('admin-client')
  @UseGuards(AuthGuard)
  getClientDashboard(@Request() req, @Query('filtro') filtro: string) {
    const email = req.user.email;
    return this.adminService.getClientDashboardStats(email, filtro);
  }

  @Get('client-profile/:id')
  @UseGuards(AuthGuard)
  getClientProfile(@Param('id') id: number) {
    return this.adminService.getClientProfileStats(+id);
  }

  @Get('general-stats')
  async getGeneralStats() {
    return this.adminService.getGeneralStats();
  }

}
