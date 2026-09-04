import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { DataSource } from "typeorm";
import { upsertMockSeedData } from "./seed";

@Injectable()
export class MockDataBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MockDataBootstrapService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    if ((process.env.AUTO_SEED_MOCK_DATA ?? "false").toLowerCase() !== "true") {
      return;
    }

    try {
      await upsertMockSeedData(this.dataSource);
      this.logger.log("Mock data bootstrap finished.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Mock data bootstrap failed: ${message}`);
      throw error;
    }
  }
}
