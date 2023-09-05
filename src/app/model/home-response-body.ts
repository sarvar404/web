import { Actor } from "./actor";
import { Channel } from "./channel";
import { Genere } from "./genere";
import { Slide } from "./slide";

export class HomeResponseBody {

    channels?: Channel[];
    slides?: Slide[];
    genres?: Genere[];
    actors?: Actor[];
    
    constructor(values: object = {})
    {
        Object.assign(this,values);
    }
}