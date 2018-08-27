

import { IWatcher } from './types';
import nextTick from './next-tick';

let queue: Array<IWatcher> = [];
let has: Map<any, any> = new Map();
let waiting: boolean = false;
let flushing: boolean = false;
let index: number = 0;


export default function queueWatcher(watcher: IWatcher) {
    const id = watcher.id;
    // 去重
    // eg name = xxx; 多次赋值情况
    if (has[id] === void 0) {
        has[id] = true;
        if (!flushing) {
            queue.push(watcher);
        }
        // queue the flush
        if (!waiting) {
            waiting = true;
            nextTick(flushSchedulerQueue);
        }
    }
}

function resetSchedulerState () {
    index = queue.length = 0;
    waiting = flushing = false;
    has = new Map();
}

function flushSchedulerQueue () {
    flushing = true;
    let watcher, id;

    queue.sort((a, b) => a.id - b.id);

    for (index = 0; index < queue.length; index++) {
        watcher = queue[index]
        id = watcher.id
        has[id] = void 0;
        watcher.run(watcher.cb);
    }
    
    resetSchedulerState();
    
}
