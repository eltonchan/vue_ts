
import { IReactive } from './types';
import Dep from './dep';

// 监听器Observer
function observe(data: any) :void {
    if (!data || typeof data !== 'object') return;
    Object.keys(data).forEach(key => {
        defineReactive({
            data,
            key, 
            value: data[key]
        });
    });
}

function defineReactive({ data, key, value }: IReactive) :void {
    observe(value);
    const dep = new Dep();
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
            value = newVal;
            dep.notify();
        }

    });
}

export default observe;
