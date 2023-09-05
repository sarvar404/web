import { Injectable } from "@angular/core";
import { GlobalService } from "./global.service";
import { Observable, catchError, of, switchMap, throwError } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { Genere } from "../model/genere";



@Injectable()
export class GenreService {

    constructor(private globalService:GlobalService,
        private _httpCliet: HttpClient){   
    }

    getGenere(data : { genre: string}): Observable<Genere[]> {
        const headers = GlobalService.getHeaders();
        return this._httpCliet.get<Genere[]>(`${GlobalService.apiHost}/api/genre/${data.genre}/${GlobalService.apiToken}/${GlobalService.itemPurchaseCode}/`, 
         {
            headers
        }).pipe( catchError( (err) => {
            console.log(err);
            return throwError(err);
        }), switchMap((response: any) => {
            // console.log(response);
            return of(response);   
        }));
    }

    getAllGenres(): Observable<Genere[]> {
        const headers = GlobalService.getHeaders();
        return this._httpCliet.get<Genere[]>(`${GlobalService.apiHost}/api/genre/all/${GlobalService.apiToken}/${GlobalService.itemPurchaseCode}/`, 
         {
            headers
        }).pipe( catchError( (err) => {
            console.log(err);
            return throwError(err);
        }), switchMap((response: any) => {
            // console.log(response);
            return of(response);   
        }));
    }

    

}