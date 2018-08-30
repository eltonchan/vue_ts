

import { IDep,  Isub, IWatcher } from './types';

let uid = 0;

export default class Dep implements IDep {
    static target: any = null;
    subs:any = [];
    id;

    constructor () {
        this.id = uid++;
        this.subs = [];
    }

    addSub(sub: IWatcher): void {
        if (this.subs.find(o => o.id === sub.id)) return;
        this.subs.push(sub);
    }

    removeSub (sub: IWatcher) {
        const idx = this.subs.findIndex(o => o.id === sub.id);
        if (idx >= 0) this.subs.splice(idx, 1);
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

