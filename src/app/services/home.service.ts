import { Injectable } from '@angular/core';
import { GlobalService } from './global.service';
import { Observable, catchError, of, switchMap, throwError } from 'rxjs';
import { HomeResponseBody } from '../model/home-response-body';
import { HttpClient } from '@angular/common/http';
import { Poster } from '../model/poster';
import { SharedService } from 'src/app/services/shared.service';

@Injectable()
export class HomeService {
  constructor(
    private globalService: GlobalService,
    private sharedService: SharedService,
    private _httpCliet: HttpClient
  ) {}

  getHomePageData(cache: boolean): Observable<HomeResponseBody> {
    const headers = cache
      ? GlobalService.getHeaders()
      : GlobalService.getNoCacheHeaders();
    return this._httpCliet
      .get<HomeResponseBody>(
        GlobalService.apiHost+
        '/api/first/' +
          GlobalService.apiToken +
          '/' +
          GlobalService.itemPurchaseCode +
          '/',
        {
          headers,
        }
      )
      .pipe(
        catchError((err) => {
          console.log(err);
          let homeData = this.sharedService.getHomeData();
          if (homeData !== null) {
            return of(homeData);
          }
          return throwError(err);
        }),
        switchMap((response: any) => {
          console.log(response);
          let homeResponseBody = of(response);
          this.sharedService.setHomeData(response);
          return homeResponseBody;
        })
      );
  }

  getPostersByGenre(genreId: number): Observable<any> {
    const headers = GlobalService.getHeaders();
    return this._httpCliet
      .get<HomeResponseBody>(
        GlobalService.apiHost+
        '/api/movie/random/' +
          genreId +
          '/' +
          GlobalService.apiToken +
          '/' +
          GlobalService.itemPurchaseCode +
          '/',
        {
          headers,
        }
      )
      .pipe(
        catchError((err) => {
          console.log(err);
          return throwError(err);
        }),
        switchMap((response: any) => {
          console.log(response);
          return of({ poster: response, genre: genreId });
        })
      );
  }

  getCacheHomePageData(): Observable<HomeResponseBody> {
    let homeData = this.sharedService.getHomeData();
    if (homeData !== null) {
      return of(homeData);
    } else {
      return this.getHomePageData(false);
    }
  }
}
