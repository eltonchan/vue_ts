// 订阅者Watcher

import { IWatcher } from './types';
import Dep from './dep';

let uid = 0;

export default class Watcher implements IWatcher{
    vm: {
        data: object
    };
    cb: Function;
    expression: string;
    id: number;
    value: any;

    constructor(options: IWatcher) {
        this.vm = options.vm;
        this.cb = options.cb;
        this.expression = options.expression;
        this.id = ++uid;
        this.value = this.get();
    }

    update() :void {
        this.run();
    }

    run() :void {
        const {
            expression,
            value: oldValue,
            vm: { data }
        } = this;
        const value = data[expression];

        if (oldValue !== value) {
            this.value = value;
            this.cb.call(this.vm, value, oldValue);
        }
    }

    get() :void {
        Dep.target = this;
        const value = this.vm.data[this.expression]; // 执行一次get 收集依赖
        Dep.target = null;
        return value;
    }
}