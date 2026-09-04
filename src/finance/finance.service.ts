import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessSettingsEntity, OrderEntity } from '../database/entities';

type FinanceSummary = {
  revenue: number;
  grossMargin: number;
  paidOrders: number;
  currency: string;
};

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(BusinessSettingsEntity)
    private readonly settingsRepository: Repository<BusinessSettingsEntity>
  ) {}

  async getSummary(): Promise<FinanceSummary> {
    const [orders, settings] = await Promise.all([
      this.orderRepository.find({
        relations: {
          items: {
            product: true
          }
        }
      }),
      this.settingsRepository.findOneBy({ id: 'business-settings' })
    ]);

    let revenue = 0;
    let grossMargin = 0;
    let paidOrders = 0;

    for (const order of orders) {
      const orderTotal = order.total;
      const orderCost = order.items.reduce(
        (sum, item) => sum + (item.product?.costPrice ?? 0) * item.quantity,
        0
      );

      if (!['refunded', 'cancelled', 'failed'].includes(order.paymentStatus)) {
        revenue += orderTotal;
        grossMargin += orderTotal - orderCost;
      }

      if (order.paymentStatus === 'paid') {
        paidOrders += 1;
      }
    }

    return {
      revenue,
      grossMargin,
      paidOrders,
      currency: settings?.currency ?? 'UZS'
    };
  }
}
