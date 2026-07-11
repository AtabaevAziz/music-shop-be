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
      const orderTotal = order.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
      const orderCost = order.items.reduce(
        (sum, item) => sum + (item.product?.costPrice ?? 0) * item.qty,
        0
      );

      if (order.paymentStatus !== 'refunded') {
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
