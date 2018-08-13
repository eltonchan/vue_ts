import { watch } from "fs";

export interface IReactive {
    data: object,
    key: string,
    value: any
}

export interface IDep {
    subs: any[],
    addSub: Function,
    notify: Function,
}

export interface Isub {
    update: Function
}

export interface IWatcher {
    vm: {
        data: object
    },
    cb: Function,
    expression: string
}

export interface IVue {
    data: object,
    methods: object,
    el: string,
    watch?: object
}