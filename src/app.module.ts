import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivityModule } from './activity/activity.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ClientModule } from './client/client.module';
import { ConfigRuntimeModule } from './config/config.module';
import { CustomersModule } from './customers/customers.module';
import { PrismaModule } from './database/prisma.module';
import { EmployeesModule } from './employees/employees.module';
import { FinanceModule } from './finance/finance.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { RepairsModule } from './repairs/repairs.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ActivityModule,
    AuthModule,
    ConfigRuntimeModule,
    SettingsModule,
    CategoriesModule,
    CustomersModule,
    EmployeesModule,
    FinanceModule,
    ProductsModule,
    InventoryModule,
    OrdersModule,
    RepairsModule,
    ClientModule
  ]
})
export class AppModule {}
