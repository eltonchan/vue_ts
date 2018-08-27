

export default function defineComputed(vm, key) {
    Object.defineProperty(vm, key, {
        enumerable: true,
        configurable: true,
        get() {
            const watcher = vm._computedWatchers && vm._computedWatchers[key];
            return watcher.value;
        },
    });
}