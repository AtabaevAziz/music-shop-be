import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Condition } from '../common/enums/condition.enum';
import { CustomerTier } from '../common/enums/customer-tier.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { ProductStatus } from '../common/enums/product-status.enum';
import { RepairStatus } from '../common/enums/repair-status.enum';
import { Role } from '../common/enums/role.enum';
import { ORDER_STATUS_TRANSITIONS } from '../common/constants/workflow.constants';

@Injectable()
export class RuntimeConfigService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly adminNavigation = [
    'dashboard',
    'catalog',
    'inventory',
    'orders',
    'customers',
    'employees',
    'finance',
    'settings',
    'repairs'
  ] as const;

  private readonly clientNavigation = ['dashboard', 'catalog', 'orders', 'repairs'] as const;

  private toDictionary<TValue extends string>(values: TValue[]) {
    return values.map((value) => ({
      value,
      labelKey: `dynamic.${value}`
    }));
  }

  async getAppConfig() {
    const settings = await this.prisma.businessSettings.findUnique({
      where: { id: 'business-settings' }
    });

    return {
      appConfig: {
        defaultLocale: 'ru',
        supportedLocales: ['ru', 'en', 'uz'],
        defaultCurrency: settings?.currency ?? 'UZS',
        features: {
          clientPortal: true,
          finance: true,
          employees: true,
          settings: true
        }
      }
    };
  }

  getAuthConfig() {
    return {
      authConfig: {
        providers: [
          {
            id: 'admin-password',
            type: 'password',
            principalType: 'role'
          },
          {
            id: 'client-password',
            type: 'password',
            principalType: 'email'
          }
        ],
        allowClientLogin: true,
        allowAdminLogin: true
      }
    };
  }

  getNavigationConfig() {
    return {
      items: [
        {
          id: 'dashboard',
          path: '/:locale/app',
          titleKey: 'nav.dashboard',
          subtitleKey: 'meta.appSubtitle',
          roles: [Role.Admin, Role.Client]
        },
        {
          id: 'catalog',
          path: '/:locale/app/catalog',
          titleKey: 'nav.catalog',
          subtitleKey: 'section.catalogSubtitle',
          roles: [Role.Admin, Role.Client]
        },
        {
          id: 'inventory',
          path: '/:locale/app/inventory',
          titleKey: 'nav.inventory',
          subtitleKey: 'section.inventorySubtitle',
          roles: [Role.Admin]
        },
        {
          id: 'orders',
          path: '/:locale/app/orders',
          titleKey: 'nav.orders',
          subtitleKey: 'section.ordersSubtitle',
          roles: [Role.Admin, Role.Client]
        },
        {
          id: 'customers',
          path: '/:locale/app/customers',
          titleKey: 'nav.customers',
          subtitleKey: 'section.customersSubtitle',
          roles: [Role.Admin]
        },
        {
          id: 'repairs',
          path: '/:locale/app/repairs',
          titleKey: 'nav.repairs',
          subtitleKey: 'section.repairsSubtitle',
          roles: [Role.Admin, Role.Client]
        },
        {
          id: 'employees',
          path: '/:locale/app/employees',
          titleKey: 'nav.employees',
          subtitleKey: 'section.employeesSubtitle',
          roles: [Role.Admin]
        },
        {
          id: 'finance',
          path: '/:locale/app/finance',
          titleKey: 'nav.finance',
          subtitleKey: 'section.financeSubtitle',
          roles: [Role.Admin]
        },
        {
          id: 'settings',
          path: '/:locale/app/settings',
          titleKey: 'nav.settings',
          subtitleKey: 'section.settingsSubtitle',
          roles: [Role.Admin]
        }
      ]
    };
  }

  getPermissionsConfig() {
    return {
      permissions: {
        [Role.Admin]: [...this.adminNavigation],
        [Role.Client]: [...this.clientNavigation]
      }
    };
  }

  getWorkflowConfig() {
    return {
      workflows: {
        orders: {
          statuses: Object.values(OrderStatus),
          transitions: ORDER_STATUS_TRANSITIONS
        }
      }
    };
  }

  getDictionariesConfig() {
    return {
      dictionaries: {
        customerTiers: this.toDictionary(Object.values(CustomerTier)),
        productStatuses: this.toDictionary(Object.values(ProductStatus)),
        repairStatuses: this.toDictionary(Object.values(RepairStatus)),
        paymentStatuses: this.toDictionary(Object.values(PaymentStatus)),
        conditions: this.toDictionary(Object.values(Condition)),
        roles: this.toDictionary(Object.values(Role))
      }
    };
  }
}
