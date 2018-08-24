
import { IReactive } from './types';
import Dep from './dep';

export const dep = new Dep();


export default class Observe {

    constructor(data) {
        this.walk(data);
    }

    walk(data): void {
        if (!data || typeof data !== 'object') return;
        Object.keys(data).forEach(key => {
            this.defineReactive({
                data,
                key, 
                value: data[key]
            });
        });
    }

    defineReactive({ data, key, value }: IReactive): void {
        const dep = new Dep();
        this.walk(value);
        const self = this;
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: true,
            get() {
                if (Dep.target) {
                    dep.addSub(Dep.target);
                }
                return value;
            },
    
            set(newVal: any): void {
                if (value === newVal) return;
                self.walk(value);
                value = newVal;
                dep.notify();
            }
    
        });
    }

}