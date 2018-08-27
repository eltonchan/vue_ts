
const callbacks:Array<Function> = [];
let pending: boolean = false;

function flushCallbacks () {
    pending = false;
    const copies = callbacks.slice(0);
    callbacks.length = 0;
    for (let i = 0; i < copies.length; i++) {
        copies[i]();
    }
}

function microTimerFunc() {
    Promise.resolve().then(flushCallbacks);
}

export default function nextTick (cb: Function) {
    callbacks.push(cb);
    if (!pending) {
        pending = true;
        microTimerFunc();
    }
}