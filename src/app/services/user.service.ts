import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { UserLogin } from "../model/user-login";
import { GlobalService } from "./global.service";
import { Observable , switchMap , catchError , of } from 'rxjs';
import { ResponseBody } from "../model/response-body";
@Injectable({
    providedIn : 'root'
})
export class USerService {

private userLogin: UserLogin | null = null;

constructor(private globalService:GlobalService,
    private _httpCliet: HttpClient){

    }



}