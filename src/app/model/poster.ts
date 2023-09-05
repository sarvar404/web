import { Genere } from "./genere";
import { Source } from "./source";
import { Trailer } from "./trailer";

export class Poster {

   id?: number;
   title?: string;
   label?: string;
   sublabel?: string;
   type?: string;
   description?: string;
   year?: string;
   imdb?: number;
   rating?: number;
   comment?: boolean;
   duration?: string;
   downloadas?: number;
   playas?: number;
   classification?: string;
   image?: string;
   cover?: string;
   genres?: Genere[];
   trailer?: Trailer;
   sources?: Source[];
    constructor(values: object = {})
    {
        Object.assign(this,values);
    }
}