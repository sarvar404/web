import { Injectable } from "@angular/core";
import { GlobalService } from "./global.service";
import { Observable, catchError, of, switchMap, throwError } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { Poster } from "../model/poster";
import { Actor } from "../model/actor";
import { SubtitleInfo } from "../model/subtitle-info";
import { MovieResponseBody } from "../model/movie-response-body";




@Injectable({
    providedIn: 'root',
})
export class MovieService {

    constructor(private globalService: GlobalService,
        private _httpCliet: HttpClient) {
    }


    getMoviesByCategory(data: { page: number, limit: number, category: string, order: string, alphabeticOrder: string }): Observable<MovieResponseBody> {
        const headers = GlobalService.getWithSecurityHeaders();
        return this._httpCliet.get<MovieResponseBody>(`${GlobalService.publicApiHost}/public/movies/get-movies-category?page=${data.page}&limit=${data.limit}&category=${data.category}&order=${data.order}&alphabeticOrder=${data.alphabeticOrder}`,
            {
                headers
            }).pipe(catchError((err) => {
                console.log(err);
                return throwError(err);
            }), switchMap((response: any) => {
                console.log(response);
                return of(response);
            }));
    }

    getMovieData(data: { genre: number, order: string, page: number }): Observable<Poster[]> {
        const headers = GlobalService.getNoCacheHeaders();
        return this._httpCliet.get<Poster[]>(`${GlobalService.apiHost}/api/movie/by/filtres/${data.genre}/${data.order}/${data.page}/${GlobalService.apiToken}/${GlobalService.itemPurchaseCode}/`,
            {
                headers
            }).pipe(catchError((err) => {
                console.log(err);
                return throwError(err);
            }), switchMap((response: any) => {
                console.log(response);
                return of(response);
            }));
    }

    getSubtitlesData(id: number, type: string): Observable<SubtitleInfo[]> {
        const headers = GlobalService.getHeaders();
        return this._httpCliet.get<SubtitleInfo[]>(`${GlobalService.apiHost}/api/subtitles/by/${type}/${id}/${GlobalService.apiToken}/${GlobalService.itemPurchaseCode}/`,
            {
                headers
            }).pipe(catchError((err) => {
                return throwError(err);
            }), switchMap((response: any) => {
                return of(response);
            }));
    }

    getCastByPoster(posterId: number): Observable<Actor[]> {
        const headers = GlobalService.getNoCacheHeaders();
        return this._httpCliet.get<Poster[]>(`${GlobalService.apiHost}/api/role/by/poster/${posterId}/${GlobalService.apiToken}/${GlobalService.itemPurchaseCode}/`,
            {
                headers
            }).pipe(catchError((err) => {
                console.log(err);
                return throwError(err);
            }), switchMap((response: any) => {
                console.log(response);
                return of(response);
            }));
    }

    getRelatedMoviesByActor(actorId: number): Observable<Poster[]> {
        const headers = GlobalService.getNoCacheHeaders();
        return this._httpCliet.get<Poster[]>(`${GlobalService.apiHost}/api/movie/by/actor/${actorId}/${GlobalService.apiToken}/${GlobalService.itemPurchaseCode}/`,
            {
                headers
            }).pipe(catchError((err) => {
                console.log(err);
                return throwError(err);
            }), switchMap((response: any) => {
                console.log(response);
                return of(response);
            }));
    }



}