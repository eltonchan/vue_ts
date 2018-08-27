// 订阅者Watcher

import { IWatcher,IVue } from './types';
import Dep from './dep';
import { noop } from './utils';

let uid = 0;

export default class Watcher implements IWatcher {
    vm;
    cb:Function = noop;
    expression;
    getter;
    id = 0;
    value: any;
    computed = false;

    constructor(
        vm: IVue,
        expression: Function,
        cb: Function,
        computed: boolean = false
    ) {
        this.vm = vm;
        vm._watchers.push(this);

        this.cb = cb || noop;
        this.expression = expression.toString();
        this.id = ++uid;
        this.computed = computed; // for computed watchers
        this.getter = expression;

        if (this.computed) {
            this.value = undefined;
        } else {
            this.value = this.get();
        }
    }

    get() :void {
        Dep.target = this;
        const value = this.getter.call(this.vm); // 执行一次get 收集依赖
        Dep.target = null;
        return value;
    }
}