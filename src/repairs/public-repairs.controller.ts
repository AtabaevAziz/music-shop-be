import { Body, Controller, Post } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import { CreatePublicRepairDto } from './dto/create-public-repair.dto';
import { RepairsService } from './repairs.service';

@Controller('public/repairs')
export class PublicRepairsController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly repairsService: RepairsService
  ) {}

  @Post()
  async createRepair(@Body() payload: CreatePublicRepairDto) {
    const customer = await this.customersService.findOrCreatePublicCustomer({
      name: payload.customerName,
      phone: payload.phone,
      email: payload.email
    });

    const repairRequest = await this.repairsService.createRepairForCustomer(
      customer.id,
      {
        instrumentName: payload.instrumentType,
        brand: payload.instrumentModel,
        issue: payload.issueDescription,
        notes: this.formatPublicRepairNotes(payload)
      }
    );

    return { repairRequest };
  }

  private formatPublicRepairNotes(payload: CreatePublicRepairDto): string {
    const lines = [
      `Public repair request`,
      `Customer: ${payload.customerName.trim()}`,
      `Phone: ${payload.phone.trim()}`,
      payload.email?.trim() ? `Email: ${payload.email.trim().toLowerCase()}` : null,
      `Instrument type: ${payload.instrumentType.trim()}`,
      `Model: ${payload.instrumentModel.trim()}`,
      payload.photoUrl?.trim() ? `Photo: ${payload.photoUrl.trim()}` : null
    ].filter(Boolean);

    return lines.join('\n');
  }
}
