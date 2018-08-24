
export interface IReactive {
    data: object,
    key: string,
    value: any
}

export interface IDep {
    // subs: any[],
    addSub: Function,
    notify: Function,
}

export interface Isub {
    update: Function
}

export interface IWatcher {
    vm: object,
    cb?: Function,
    expression: string,
    computed?: boolean,
}

export interface IVue {
    _data: object,
    methods: object,
    el: string,
    _watchers: any[]
}