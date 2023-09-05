import { Poster } from "./poster";

export class Genere {
    id?: number;
    title?: string;
    posters?: Poster[];

    constructor(values: object = {})
    {
        Object.assign(this,values);
    }
}