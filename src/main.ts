
// mvvm 
import { IVue } from './types';
import { proxy } from './utils';
import observe from './observe';
import Compile from './Compile';
import Watcher from './watcher';


let uid = 0;
class Vue {
    id: number;
    data: object = {};
    methods: object = {};
    el: Node | null;
    _vm: {
        data: object
    };
    _watch: any[] = [];

    constructor(options: IVue) {
        this.id = ++uid;
        this._vm = this;
        this.data = options.data;
        this.methods = options.methods;
        this.el = document.querySelector(options.el);

        const keys = Object.keys(options.data);
        let i = keys.length;

        while(i--) {
            proxy(this, "data", keys[i]);
        }

        observe(this.data);

        new Compile({ el: this.el, vm: this });

        this.initWatch(options.watch);

    }

    $watch(expression: string, cb: Function): void {
        this._watch.push(new Watcher({
            vm: this,
            expression,
            cb
        }));
    }

    initWatch(watch) {
        if (!watch || typeof watch !== 'object') return;
        const keys = Object.keys(watch);
        let i = keys.length;

        while(i--) {
            const key = keys[i];
            const cb = watch[key];
            this.$watch(key, cb);
        }
    }
}

(window as any).Vue = Vue;