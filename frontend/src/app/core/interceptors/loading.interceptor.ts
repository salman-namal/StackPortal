import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private readonly loading: LoadingService) {}
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (req.headers.has('X-Skip-Loading')) return next.handle(req);
    this.loading.begin();
    return next.handle(req).pipe(finalize(() => this.loading.end()));
  }
}

