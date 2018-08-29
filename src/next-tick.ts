
const callbacks:Array<Function> = [];
let pending: boolean = false;

function flushCallbacks () {
    pending = false;
    const copies = callbacks.slice(0);
    const len = copies.length;
    callbacks.length = 0;
    for (let i = 0; i < len; i++) {
        copies[i]();
    }
}

function microTimerFunc() {
    Promise.resolve().then(flushCallbacks);
}

export default function nextTick (cb: Function) {
    callbacks.push(cb);
    // 一个标记位，标记等待状态
    // 即函数已经被推入任务队列或者主线程，已经在等待当前栈执行完毕去执行
    // 这样就不需要在push多个回调到callbacks时将timerFunc多次推入任务队列或者主线程
    if (!pending) {
        pending = true;
        microTimerFunc();
    }
}