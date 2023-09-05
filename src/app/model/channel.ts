import { Category } from "./category";
import { Source } from "./source";

export class Channel {
    id?: number;
    title?: string;
    lable?: string;
    sublabel?: string;
    description?: string;
    website?: string;
    classification?: string;
    views?: number;
    shares?: number;
    rating?: number;
    playas?: number;
    comment?: boolean;
    image?: string;
    sources?: Source[];
    categories?: Category[];
    countries?: string[];
    category?: string;

    constructor(values: object = {})
    {
        Object.assign(this,values);
    }

}