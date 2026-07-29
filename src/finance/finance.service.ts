import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

type FinanceSummary = {
  revenue: number;
  grossMargin: number;
  paidOrders: number;
  currency: string;
};

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(): Promise<FinanceSummary> {
    const [orders, settings] = await Promise.all([
      this.prisma.order.findMany({
        include: {
          items: {
            include: {
              product: {
                select: {
                  costPrice: true
                }
              }
            }
          }
        }
      }),
      this.prisma.businessSettings.findUnique({
        where: { id: 'business-settings' }
      })
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
