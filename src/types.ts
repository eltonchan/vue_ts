
export interface IReactive {
    data: object,
    key: string,
    value: any
}

export interface IDep {
    subs: any[],
    id: number,
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
    id: number,
    run: Function
}

export interface IVue {
    _data: object,
    methods: object,
    el: string,
    _watchers: any[],
}
