import { IVue } from "./types";


export default function defineComputed(vm: IVue, key: string) {
    Object.defineProperty(vm, key, {
        enumerable: true,
        configurable: true,
        get() {
            const watcher = vm._computedWatchers && vm._computedWatchers[key];
            return watcher.value;
        },
    });
}