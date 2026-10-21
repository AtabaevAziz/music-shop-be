import {
  deliverySeeds,
  orderSeeds,
  orderStatusHistorySeeds,
  packagingDetailSeeds,
  paymentSeeds,
} from "./seed-data";
import {
  normalizeSeedOptionalString,
  normalizeSeedRequiredString,
} from "./seed";
import { MockDataBootstrapService } from "./mock-data-bootstrap.service";

describe("seed normalization helpers", () => {
  it("trims required string values", () => {
    expect(normalizeSeedRequiredString("  Fender  ")).toBe("Fender");
  });

  it("preserves nullish optional values", () => {
    expect(normalizeSeedOptionalString(undefined)).toBeUndefined();
    expect(normalizeSeedOptionalString(null)).toBeNull();
  });

  it("normalizes blank optional values to null", () => {
    expect(normalizeSeedOptionalString("   ")).toBeNull();
  });

  it("trims populated optional values", () => {
    expect(normalizeSeedOptionalString("  Akmal R.  ")).toBe("Akmal R.");
  });
});

describe("mock data bootstrap safety", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAutoSeed = process.env.AUTO_SEED_MOCK_DATA;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.AUTO_SEED_MOCK_DATA = originalAutoSeed;
  });

  it("fails closed when automatic seed is enabled in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.AUTO_SEED_MOCK_DATA = "true";

    const service = new MockDataBootstrapService({} as never);

    await expect(service.onApplicationBootstrap()).rejects.toThrow(
      "AUTO_SEED_MOCK_DATA must be disabled in production environments.",
    );
  });
});

describe("workflow seed coverage", () => {
  it("provides workflow records for every seeded order", () => {
    const orderIds = orderSeeds.map((order) => order.id);

    expect(paymentSeeds.map((payment) => payment.orderId).sort()).toEqual(
      [...orderIds].sort(),
    );
    expect(deliverySeeds.map((delivery) => delivery.orderId).sort()).toEqual(
      [...orderIds].sort(),
    );
    expect(
      packagingDetailSeeds
        .map((packagingDetail) => packagingDetail.orderId)
        .sort(),
    ).toEqual([...orderIds].sort());
  });

  it("records at least one status history entry for every seeded order", () => {
    const historyOrderIds = new Set(
      orderStatusHistorySeeds.map((entry) => entry.orderId),
    );

    expect(orderSeeds.every((order) => historyOrderIds.has(order.id))).toBe(
      true,
    );
  });
});
