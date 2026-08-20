import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';

export class AppRouteReuseStrategy implements RouteReuseStrategy {
  private readonly storedHandles = new Map<string, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return !!this.getCacheKey(route);
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    const cacheKey = this.getCacheKey(route);
    if (!cacheKey) {
      return;
    }

    if (handle) {
      this.storedHandles.set(cacheKey, handle);
      return;
    }

    this.storedHandles.delete(cacheKey);
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const cacheKey = this.getCacheKey(route);
    return !!cacheKey && this.storedHandles.has(cacheKey);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const cacheKey = this.getCacheKey(route);
    if (!cacheKey) {
      return null;
    }

    return this.storedHandles.get(cacheKey) ?? null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    if (future.routeConfig === curr.routeConfig) {
      return true;
    }

    const futureReuseKey = this.getReuseKey(future);
    const currentReuseKey = this.getReuseKey(curr);

    return !!futureReuseKey && futureReuseKey === currentReuseKey;
  }

  private getReuseKey(route: ActivatedRouteSnapshot): string {
    return String(route.data?.['reuseComponent'] || '').trim();
  }

  private getCacheKey(route: ActivatedRouteSnapshot): string {
    return String(route.data?.['cacheComponent'] || '').trim();
  }
}