
export const noop = () => null;

export function proxy (target, sourceKey, key) {
    Object.defineProperty(target, key, {
        enumerable: true,
        configurable: true,
        get() {
            return this[sourceKey][key];
        },

        set(val: any) {
            this[sourceKey][key] = val;
        }
    });
}


export function callHook (vm, hook) {
    const handlers = vm._options[hook];
    if (handlers && typeof handlers === 'function') {
        handlers.call(vm);
    }
}