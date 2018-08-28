
// mvvm 
import { IVue } from './types';
import { proxy, noop } from './utils';
import Observe from './observe';
import Compile from './Compile';
import Watcher from './watcher';
import defineComputed from './computed';
import { callHook } from './utils';


let uid = 0;

export default class Vue implements IVue {
    id = 0;
    el = '';
    vm: Vue;
    _compile: Compile;
    _data = Object.create(null);
    methods = Object.create(null);
    _computedWatchers = Object.create(null);
    _watchers: any[] = [];
    _updates: Array<Function> = [];
    _options: object;

    constructor(options) {
        this.id = ++uid;
        this.vm = this;
        this._options = options;
        this._data = options.data;
        this.methods = options.methods;
        this.el = options.el;

        this.initData();
        this.initComputed(options.computed);

        this.$mount();
        callHook(this, 'mounted');

        this.initWatch(options.watch);

    }

    initData() {
        const keys = Object.keys(this._data);
        let i = keys.length;

        while(i--) {
            proxy(this, "_data", keys[i]);
        }

        new Observe(this._data);
    }

    $mount() {
        const el = document.querySelector(this.el);
        this._compile = new Compile(this, el);
        new Watcher(this, this._render, noop);
    }

    _render() {
        const updates = this._updates;
        for (let i = 0; i < updates.length; i++) {
            updates[i]();
        }
    }

    initWatch(watch) {
        if (!watch || typeof watch !== 'object') return;
        const keys = Object.keys(watch);
        let i = keys.length;

        while(i--) {
            const key = keys[i];
            const cb = watch[key];
            new Watcher(this, key, cb);
        }
    }

    initComputed(computed) {
        if (!computed || typeof computed !== 'object') return;
        const keys = Object.keys(computed);
        const watchers = this._computedWatchers;
        let i = keys.length;
        while(i--) {
            const key = keys[i];
            const func = computed[key];
            watchers[key] = new Watcher(
                this,
                func || noop,
                noop,
            );

            defineComputed(this, key);
        }
    }
}

