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
            id: 'staff-password',
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
        allowStaffLogin: true
      }
    };
  }

  getNavigationConfig() {
    return {
      items: [
        {
          id: 'dashboard',
          path: '/:locale',
          titleKey: 'nav.dashboard',
          subtitleKey: 'meta.appSubtitle',
          roles: [Role.Admin, Role.StoreManager, Role.CatalogManager, Role.SalesOperator, Role.Client]
        },
        {
          id: 'catalog',
          path: '/:locale/catalog',
          titleKey: 'nav.catalog',
          subtitleKey: 'section.catalogSubtitle',
          roles: [Role.Admin, Role.StoreManager, Role.CatalogManager, Role.Client]
        },
        {
          id: 'inventory',
          path: '/:locale/inventory',
          titleKey: 'nav.inventory',
          subtitleKey: 'section.inventorySubtitle',
          roles: [Role.Admin, Role.StoreManager, Role.CatalogManager]
        },
        {
          id: 'orders',
          path: '/:locale/orders',
          titleKey: 'nav.orders',
          subtitleKey: 'section.ordersSubtitle',
          roles: [Role.Admin, Role.StoreManager, Role.SalesOperator, Role.Client]
        },
        {
          id: 'customers',
          path: '/:locale/customers',
          titleKey: 'nav.customers',
          subtitleKey: 'section.customersSubtitle',
          roles: [Role.Admin, Role.StoreManager, Role.SalesOperator]
        },
        {
          id: 'repairs',
          path: '/:locale/repairs',
          titleKey: 'nav.repairs',
          subtitleKey: 'section.repairsSubtitle',
          roles: [Role.Admin, Role.StoreManager, Role.SalesOperator, Role.Client]
        }
      ]
    };
  }

  getPermissionsConfig() {
    return {
      permissions: {
        [Role.Admin]: ['dashboard', 'catalog', 'inventory', 'orders', 'customers', 'employees', 'settings', 'repairs'],
        [Role.StoreManager]: ['dashboard', 'catalog', 'inventory', 'orders', 'customers', 'employees', 'settings', 'repairs'],
        [Role.CatalogManager]: ['dashboard', 'catalog', 'inventory'],
        [Role.SalesOperator]: ['dashboard', 'orders', 'customers', 'repairs'],
        [Role.Client]: ['dashboard', 'catalog', 'orders', 'repairs']
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
        customerTiers: Object.values(CustomerTier),
        productStatuses: Object.values(ProductStatus),
        repairStatuses: Object.values(RepairStatus),
        paymentStatuses: Object.values(PaymentStatus),
        conditions: Object.values(Condition),
        roleMetadata: Object.values(Role).map((role) => ({
          id: role,
          labelKey: `role.${role}`
        }))
      }
    };
  }
}
