import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const requiredRoles = route.data['roles'] as string[] | undefined;
    if (!requiredRoles || requiredRoles.length === 0) {
      return new Observable(subscriber => {
        subscriber.next(true);
        subscriber.complete();
      });
    }

    return this.auth.rolesStream$().pipe(
      take(1),
      map((userRoles: string[]) => {
        if (requiredRoles.some(r => userRoles.includes(r))) {
          return true;
        }
        return this.router.parseUrl('/auth/login');
      })
    );
  }
}

