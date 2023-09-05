import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpHeaders } from "@angular/common/http";


@Injectable()
export class GlobalService {
    public static apiHost: string = environment.apiHost;
    public static apiToken: string = environment.apiToken;
    public static itemPurchaseCode: string = environment.itemPurchaseCode;
    public static publicApiHost: string = environment.publicApiHost;
    
    constructor() {

    }

    static getLoginHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded'
        });
    }

    static getHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Content-Type': 'application/json'
        });
    }
    static getWithSecurityHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'x-security-header': '755b591e9d70327f62de7c901eee67241'
        });
    }
    static getNoCacheHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'no-cache': 'true'
        });
    }

}