import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { NgxSpinnerService } from "ngx-spinner";
import { Observable, of, throwError } from "rxjs";
import { catchError, concatMap, retry, retryWhen } from "rxjs/operators";
import Swal from "sweetalert2";
import { ErrorCode } from "../enums/enums";
import { AlertifyService } from "./alertify.service";


@Injectable({
  providedIn: 'root'
})

export class HttpErrorInterceptorService implements HttpInterceptor {

  constructor(private alertify: AlertifyService,  private spinner: NgxSpinnerService) {

  }

  intercept(request: HttpRequest<any>, next: HttpHandler) {
    console.log("http request started");
    return next.handle(request)
      .pipe(
        retryWhen(error => this.retryRequest(error, 3)),
        catchError((error: HttpErrorResponse) => {
          const errorMessage = this.setError(error.error.message);
          console.log(error);
          this.spinner.hide();
           Swal.fire('Error!',  errorMessage, 'error'  );
          return throwError(errorMessage);
        })
      );
  }

  //Retry the request in case of error
  retryRequest(error: Observable<unknown>, retryCount: number): Observable<unknown> {

    return error.pipe(
      concatMap((checkError: HttpErrorResponse , count: any) => {

        //Retry on the basis of the type of error returned
        if (count <= retryCount) {
          switch (checkError.status) {
            case ErrorCode.serverDown:
              return of(checkError);
            // case ErrorCode.unauthorised :
            //   return of(checkError);
          }
        }
        return throwError(checkError);
      })
    );
  }


  setError(error: HttpErrorResponse): string {
    let errorMessage = "Unknown error occured";
    if (error.error instanceof ErrorEvent) {
      //Client side error
      errorMessage = error.message;
    } else {

      if (error.status === 401) {
        return error.statusText;
      }
      //server side error
      if (error.error.errorMessage && error.status !== ErrorCode.serverDown) { // error status of 0 means server is down
        errorMessage = error.error;
      }
    }
    return errorMessage;
  }
}
