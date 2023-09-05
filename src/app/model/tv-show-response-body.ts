
import { TvShow } from "./tv-show";


export class TvShowResponseBody {
    webshows?: TvShow[];
    currentPage?: number;
    totalPages?: number;
    constructor(values: object = {}) {
        this.webshows = [];
        this.currentPage = 0;
        this.totalPages = 0;
        Object.assign(this,values);
    }

}