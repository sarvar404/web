import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, from, of, switchMap, throwError } from 'rxjs';
import { ResponseBody } from '../model/response-body';
import { UserLogin } from '../model/user-login';
import { GlobalService } from './global.service';
import { FirebaseService } from './firebase.service';
import { SubscriptionChangeEnum } from '../model/subscription-change-enum';

@Injectable()
export class AuthService {
  private _authenticated: boolean = false;

  constructor(
    private globalService: GlobalService,
    private _httpCliet: HttpClient,
    private firebaseService: FirebaseService
  ) {}

  set accessToken(token: string) {
    localStorage.setItem('accessToken', token);
  }

  get accessToken(): string {
    return localStorage.getItem('accessToken') ?? '';
  }

  doLogin(credentials: UserLogin): Observable<ResponseBody> {

    this._authenticated = false;
    const headers = GlobalService.getLoginHeaders();
    const formData: any = new URLSearchParams();
    formData.set('username', credentials.username);
    formData.set('password', credentials.password);
    return this._httpCliet
      .post<ResponseBody>(
        GlobalService.apiHost+
        '/api/user/login/' +
          GlobalService.apiToken +
          '/' +
          GlobalService.itemPurchaseCode +
          '/',
        formData.toString(),
        {
          headers,
        }
      )
      .pipe(
        catchError((err) => {
          console.log(err);
          this._authenticated = false;

          return of(
            new ResponseBody({
              code: err.status,
              message: err.statusText,
              values: [],
            })
          );
        }),
        switchMap((response: any) => {
          console.log(response);
          if (
            response.code == '200' &&
            response.message == 'You have successfully logged in'
          ) {
            this._authenticated = true;
            this.accessToken = response.values.find(
              (k: any) => k.name === 'token'
            ).value;
            localStorage.setItem(
              'username',
              response.values.find((k: any) => k.name === 'username').value
            );
            localStorage.setItem(
              'name',
              response.values.find((k: any) => k.name === 'name').value
            );
            
          }
          return of(response);
        })
      );
  }
  

  async onContentPlayed(): Promise<boolean> {
    return this.firebaseService
      .addDeviceIdToSubscription(localStorage.getItem('username') + '')
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  }

 

  doLogout(): Observable<any> {
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    localStorage.clear();
    this._authenticated = false;
    return of(true);
  }
  check(): Observable<boolean> {
    if (this._authenticated) {
      return of(true);
    }

    if (this.accessToken && this.accessToken.length > 0) {
      return of(true);
    }
    return of(false);
  }
  observeSubscriptionChanges(): Observable<SubscriptionChangeEnum> {
    return this.firebaseService.registerSubscriptionEvents(
      localStorage.getItem('username') + ''
    );
  }

  unsubscribeFirebaseEvents(): void {
    this.firebaseService.unsubscribeFromSubscriptionEvents();
  }
}
