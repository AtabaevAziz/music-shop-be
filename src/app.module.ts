import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActivityModule } from './activity/activity.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ClientModule } from './client/client.module';
import { ConfigRuntimeModule } from './config/config.module';
import { CustomersModule } from './customers/customers.module';
import { DATABASE_ENTITIES } from './database/database.entities';
import { MockDataBootstrapService } from './database/mock-data-bootstrap.service';
import { EmployeesModule } from './employees/employees.module';
import { FinanceModule } from './finance/finance.module';
import { HealthModule } from './health/health.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { RepairsModule } from './repairs/repairs.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.getOrThrow<string>('DATABASE_URL'),
        entities: [...DATABASE_ENTITIES],
        autoLoadEntities: true,
        synchronize: false
      })
    }),

    ActivityModule,
    AuthModule,
    ConfigRuntimeModule,
    SettingsModule,
    CategoriesModule,
    CustomersModule,
    EmployeesModule,
    FinanceModule,
    HealthModule,
    ProductsModule,
    InventoryModule,
    OrdersModule,
    RepairsModule,
    ClientModule
  ],
  providers: [MockDataBootstrapService]
})
export class AppModule {}
