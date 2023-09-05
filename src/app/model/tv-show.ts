import { Category } from "./category";

export class TvShow {
    _id?: string;
    title?: string;
    description?: string;
    year?: string;
    rating?: string;
    duration?: string;
    tags?: string[];
    enable_comments?: boolean;
    categories?: Category[];
    poster?: string;
    banner?: string;
    guid?: number;
    trailer?: string
    created_at?: string;
    updated_at?: string;


    constructor(values: object = {})
    {
        Object.assign(this,values);
    }
}