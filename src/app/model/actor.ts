export class Actor {
    id?: number;
    type?: string;
    name?: string;
    bio?: string;
    height?: string;
    born?: string;
    image?: string;
    role?: string;

    constructor(values: object = {})
    {
        Object.assign(this,values);
    }
}