
import Dep from './dep';

export default function defineComputed(vm, key, cb) {
    const func = cb.bind(vm);
    let value;
    const watcher = vm._computedWatchers[key];
    watcher.cb = function () {
        value = func();
        watcher.value = value;
    };
    Dep.target = vm._computedWatchers[key];
    value = func();

    Dep.target = null;

    Object.defineProperty(vm, key, {
        enumerable: true,
        configurable: true,
        get() {
            return value;
        },
    });
}