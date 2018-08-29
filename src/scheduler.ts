

import { IWatcher } from './types';
import nextTick from './next-tick';

let queue: Array<IWatcher> = [];
let has: Map<any, any> = new Map();
let waiting: boolean = false;


export default function queueWatcher(watcher: IWatcher) {
    const id = watcher.id;
    // 去重
    // 同一个watcher 不重复添加
    if (has[id] === void 0) {
        has[id] = true;
        queue.push(watcher);
        // waiting queue the flush
        if (!waiting) {
            waiting = true;
            nextTick(flushSchedulerQueue);
        }
    }
}

function resetSchedulerState () {
    queue.length = 0;
    waiting = false;
    has = new Map();
}

// flushSchedulerQueue是下一个tick时的回调函数，主要目的是执行Watcher的run函数，用来更新视图
function flushSchedulerQueue () {
    let watcher, id;

    // 先创建 先执行 组件更新的顺序是从父组件到子组件的顺序，因为父组件总是比子组件先创建
    queue.sort((a, b) => a.id - b.id);
    const len = queue.length;

    for (let i = 0; i < len; i++) {
        watcher = queue[i];
        id = watcher.id;
        has[id] = void 0;
        watcher.run(watcher.cb);
    }
    
    resetSchedulerState();
    
}
