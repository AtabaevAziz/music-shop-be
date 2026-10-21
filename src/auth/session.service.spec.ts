import { SessionService } from "./session.service";

describe("SessionService cookie security", () => {
  it("forces secure cookies in production", () => {
    const service = new SessionService({} as never, {
      get: (key: string) => (key === "NODE_ENV" ? "production" : undefined),
    } as never);

    expect(service.secureCookie).toBe(true);
  });

  it("honors the configured cookie flag outside production", () => {
    const service = new SessionService({} as never, {
      get: (key: string) =>
        key === "NODE_ENV" ? "development" : key === "SESSION_SECURE_COOKIE" ? "true" : undefined,
    } as never);

    expect(service.secureCookie).toBe(true);
  });
});
