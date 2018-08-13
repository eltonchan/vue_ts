
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
