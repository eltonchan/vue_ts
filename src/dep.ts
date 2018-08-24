

import { IDep,  Isub } from './types';

export default class Dep implements IDep {
    subs:any = [];
    static target: any = null;

    addSub(sub): void {
        this.subs.push(sub);
    }

    notify():void {
        this.subs.forEach((sub: Isub) => {
            sub.update();
        })
    }
}

