import { Poster } from "./poster";

export class Slide {

    id?: number;
    title?: string;
    image?: string;
    poster?: Poster;
    
    constructor(values: object = {})
    {
        Object.assign(this,values);
    }
}