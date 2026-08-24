import { CallHandler, ExecutionContext, Injectable, NestInterceptor, NotFoundException } from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class NotFoundInterceptor implements NestInterceptor {
  private errorMessage: string = 'error in controller has happened';
  constructor() { }

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(tap(data => {
      if (data === undefined) {
        console.error('NotFoundInterceptor', context.getClass(), this.errorMessage);
        //throw new NotFoundException(this.errorMessage);
      }
    }));
  }

}
