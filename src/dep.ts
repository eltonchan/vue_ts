

import { IDep,  Isub } from './types';

let uid = 0;

export default class Dep implements IDep {
    static target: any = null;
    subs:any = [];
    id;

    constructor () {
        this.id = uid++;
        this.subs = [];
    }

    addSub(sub): void {
        if (this.subs.find(o => o.id === sub.id)) return;
        this.subs.push(sub);
    }

    notify():void {
        this.subs.forEach((sub: Isub) => {
            sub.update();
        })
    }

    depend () {
        if (Dep.target) {
            Dep.target.addDep(this);
        }
    }
}

