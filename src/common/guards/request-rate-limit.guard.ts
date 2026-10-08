import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Request } from "express";
import { ApiException } from "../exceptions/api.exception";

type Bucket = { count: number; resetAt: number };

@Injectable()
export class RequestRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const route = `${request.method}:${request.path}`;
    const limit = this.getLimit(route);
    if (!limit) {
      return true;
    }

    const now = Date.now();
    const key = `${request.ip}:${route}`;
    const current = this.buckets.get(key);
    const bucket = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + limit.windowMs }
      : current;

    bucket.count += 1;
    this.buckets.set(key, bucket);
    if (bucket.count > limit.max) {
      throw ApiException.rateLimited("Too many requests. Please retry later.");
    }

    if (this.buckets.size > 10_000) {
      for (const [bucketKey, value] of this.buckets) {
        if (value.resetAt <= now) this.buckets.delete(bucketKey);
      }
    }

    return true;
  }

  private getLimit(route: string): { max: number; windowMs: number } | null {
    if (route === "POST:/api/v1/auth/login") return { max: 5, windowMs: 60_000 };
    if (route === "POST:/api/v1/auth/register") return { max: 3, windowMs: 3_600_000 };
    if (route === "POST:/api/v1/public/orders") return { max: 20, windowMs: 60_000 };
    if (route === "POST:/api/v1/public/repairs") return { max: 20, windowMs: 60_000 };
    return null;
  }
}
