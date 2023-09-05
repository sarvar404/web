import { Movie } from "./movie";


export class MovieResponseBody {
    movies?: Movie[];
    currentPage?: number;
    totalPages?: number;
    constructor(values: object = {}) {
        this.movies = [];
        this.currentPage = 0;
        this.totalPages = 0;
        Object.assign(this,values);
    }

}