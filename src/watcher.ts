// 订阅者Watcher

import { IWatcher,IVue } from './types';
import Dep from './dep';
import { noop } from './utils';
import queueWatcher from './scheduler';

let uid = 0;

export default class Watcher implements IWatcher {
    vm;
    cb: Function = noop;
    expression;
    getter;
    depIds: Set<any>;
    id = 0;
    value: any;
    computed: boolean = false;

    constructor(
        vm: IVue,
        expression: Function | string,
        cb: Function,
    ) {
        this.vm = vm;
        vm._watchers.push(this);

        this.cb = cb || noop;

        this.id = ++uid;

        // 处理watch 的情况
        if (typeof expression === 'function') {
            this.getter = expression;
        } else {
            this.getter = () => vm[expression];
        }

        this.expression = expression.toString();
        this.depIds = new Set();

        this.value = this.get();
    }

    get() :void {
        Dep.target = this;
        const value = this.getter.call(this.vm); // 执行一次get 收集依赖
        Dep.target = null;
        return value;
    }

    addDep(dep: Dep) {
        const id = dep.id;
        if (!this.depIds.has(id)) {
            dep.addSub(this);
        }
    }

    update() {
        // 推送到观察者队列中，下一个tick时调用。*/
        queueWatcher(this);
    }

    run(cb) {
        const value = this.get();
        if (value !== this.value) {
            const oldValue = this.value;
            this.value = value;
            cb.call(this.vm, value, oldValue);
        }
    }

}