import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { StaffOnlyGuard } from '../auth/guards/staff-only.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

@Controller('employees')
@UseGuards(SessionAuthGuard, StaffOnlyGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  listEmployees() {
    return this.employeesService.listEmployees();
  }

  @Post()
  async createEmployee(@Body() payload: CreateEmployeeDto) {
    const employee = await this.employeesService.createEmployee(payload);
    return { employee };
  }

  @Put(':id')
  async updateEmployee(@Param('id') id: string, @Body() payload: UpdateEmployeeDto) {
    const employee = await this.employeesService.updateEmployee(id, payload);
    return { employee };
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteEmployee(@Param('id') id: string): Promise<void> {
    await this.employeesService.deleteEmployee(id);
  }
}

