(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (factory());
}(this, (function () { 'use strict';

    var noop = function () { return null; };
    function proxy(target, sourceKey, key) {
        Object.defineProperty(target, key, {
            enumerable: true,
            configurable: true,
            get: function () {
                return this[sourceKey][key];
            },
            set: function (val) {
                this[sourceKey][key] = val;
            }
        });
    }
    function callHook(vm, hook) {
        var handlers = vm._options[hook];
        if (handlers && typeof handlers === 'function') {
            handlers.call(vm);
        }
    }

    var uid = 0;
    var Dep = /** @class */ (function () {
        function Dep() {
            this.subs = [];
            this.id = uid++;
            this.subs = [];
        }
        Dep.prototype.addSub = function (sub) {
            if (this.subs.find(function (o) { return o.id === sub.id; }))
                return;
            this.subs.push(sub);
        };
        Dep.prototype.notify = function () {
            this.subs.forEach(function (sub) {
                sub.update();
            });
        };
        Dep.prototype.depend = function () {
            if (Dep.target) {
                Dep.target.addDep(this);
            }
        };
        Dep.target = null;
        return Dep;
    }());

    var Observe = /** @class */ (function () {
        function Observe(data) {
            this.walk(data);
        }
        Observe.prototype.walk = function (data) {
            var _this = this;
            if (!data || typeof data !== 'object')
                return;
            Object.keys(data).forEach(function (key) {
                _this.defineReactive({
                    data: data,
                    key: key,
                    value: data[key]
                });
            });
        };
        Observe.prototype.defineReactive = function (_a) {
            var data = _a.data, key = _a.key, value = _a.value;
            var dep = new Dep();
            this.walk(value);
            var self = this;
            Object.defineProperty(data, key, {
                enumerable: true,
                configurable: true,
                get: function () {
                    if (Dep.target) {
                        Dep.target.addDep(dep);
                    }
                    return value;
                },
                set: function (newVal) {
                    if (value === newVal)
                        return;
                    self.walk(value);
                    value = newVal;
                    dep.notify();
                }
            });
        };
        return Observe;
    }());

    var Compile = /** @class */ (function () {
        function Compile(vm, el) {
            this.vm = vm;
            this.el = el;
            this.init();
        }
        Compile.prototype.init = function () {
            this.fragment = this.nodeToFragment(this.el);
            this.compileElement(this.fragment);
            this.el.appendChild(this.fragment);
        };
        Compile.prototype.nodeToFragment = function (el) {
            var fragment = document.createDocumentFragment();
            var child = el.firstChild;
            while (child) {
                // 将Dom元素移入fragment中
                fragment.appendChild(child);
                child = el.firstChild;
            }
            return fragment;
        };
        Compile.prototype.compileElement = function (el) {
            var childNodes = el.childNodes;
            var self = this;
            [].slice.call(childNodes).forEach(function (node) {
                var reg = /\{\{(.*)\}\}/;
                var text = node.textContent;
                if (self.isElementNode(node)) {
                    self.compile(node);
                }
                else if (self.isTextNode(node) && reg.test(text)) {
                    self.compileText(node, self.vm, reg.exec(text));
                }
                if (node.childNodes && node.childNodes.length) {
                    self.compileElement(node);
                }
            });
        };
        Compile.prototype.compile = function (node) {
            var nodeAttrs = node.attributes;
            var self = this;
            Array.prototype.forEach.call(nodeAttrs, function (attr) {
                var attrName = attr.name;
                if (self.isDirective(attrName)) {
                    var exp = attr.value;
                    var idx = attrName.indexOf('@') === 0 ? 0 : 2;
                    var dir = attrName.substring(idx);
                    if (self.isEventDirective(dir)) { // 事件指令
                        self.compileEvent(node, self.vm, exp, dir);
                    }
                    else { // v-model 指令
                        self.compileModel(node, self.vm, exp);
                    }
                    // node.removeAttribute(attrName);
                }
            });
        };
        Compile.prototype.compileText = function (node, vm, expArray) {
            var _this = this;
            if (!Array.isArray(expArray) && !expArray[1])
                return;
            var exp = expArray[1].trim();
            var self = this;
            var initText = this.vm[exp];
            this.updateText(node, initText);
            vm._updates.push(function () {
                var initText = _this.vm[exp];
                self.updateText(node, initText);
            });
        };
        Compile.prototype.compileEvent = function (node, vm, exp, dir) {
            var eventType = dir.indexOf('@') >= 0 ? dir.substring(1) : dir.split(':')[1];
            var cb = vm.methods && vm.methods[exp];
            if (eventType && cb) {
                node.addEventListener(eventType, cb.bind(vm), false);
            }
        };
        Compile.prototype.compileModel = function (node, vm, exp) {
            var _this = this;
            var self = this;
            var val = this.vm[exp];
            this.modelUpdater(node, val);
            vm._updates.push(function () {
                var val = _this.vm[exp];
                self.modelUpdater(node, val);
            });
            node.addEventListener('input', function (e) {
                var newValue = e.target.value;
                if (val === newValue) {
                    return;
                }
                self.vm[exp] = newValue;
                val = newValue;
            });
        };
        Compile.prototype.updateText = function (node, value) {
            node.textContent = typeof value === 'undefined' ? '' : value;
        };
        Compile.prototype.modelUpdater = function (node, value) {
            node.value = typeof value === 'undefined' ? '' : value;
        };
        Compile.prototype.isDirective = function (attr) {
            return attr.indexOf('v-') === 0 || attr.indexOf('@') === 0;
        };
        Compile.prototype.isEventDirective = function (dir) {
            return dir.indexOf('on:') === 0 || dir.indexOf('@') === 0;
        };
        Compile.prototype.isElementNode = function (node) {
            return node.nodeType === 1;
        };
        Compile.prototype.isTextNode = function (node) {
            return node.nodeType === 3;
        };
        return Compile;
    }());

    var callbacks = [];
    var pending = false;
    function flushCallbacks() {
        pending = false;
        var copies = callbacks.slice(0);
        callbacks.length = 0;
        for (var i = 0; i < copies.length; i++) {
            copies[i]();
        }
    }
    function microTimerFunc() {
        Promise.resolve().then(flushCallbacks);
    }
    function nextTick(cb) {
        callbacks.push(cb);
        if (!pending) {
            pending = true;
            microTimerFunc();
        }
    }

    var queue = [];
    var has = new Map();
    var waiting = false;
    var flushing = false;
    var index = 0;
    function queueWatcher(watcher) {
        var id = watcher.id;
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
    function resetSchedulerState() {
        index = queue.length = 0;
        waiting = flushing = false;
        has = new Map();
    }
    // flushSchedulerQueue是下一个tick时的回调函数，主要目的是执行Watcher的run函数，用来更新视图
    function flushSchedulerQueue() {
        flushing = true;
        var watcher, id;
        // 先创建 先执行 组件更新的顺序是从父组件到子组件的顺序，因为父组件总是比子组件先创建
        queue.sort(function (a, b) { return a.id - b.id; });
        for (index = 0; index < queue.length; index++) {
            watcher = queue[index];
            id = watcher.id;
            has[id] = void 0;
            watcher.run(watcher.cb);
        }
        resetSchedulerState();
    }

    // 订阅者Watcher
    var uid$1 = 0;
    var Watcher = /** @class */ (function () {
        function Watcher(vm, expression, cb) {
            this.cb = noop;
            this.id = 0;
            this.computed = false;
            this.vm = vm;
            vm._watchers.push(this);
            this.cb = cb || noop;
            this.id = ++uid$1;
            // 处理watch 的情况
            if (typeof expression === 'function') {
                this.getter = expression;
            }
            else {
                this.getter = function () { return vm[expression]; };
            }
            this.expression = expression.toString();
            this.depIds = new Set();
            this.value = this.get();
        }
        Watcher.prototype.get = function () {
            Dep.target = this;
            var value = this.getter.call(this.vm); // 执行一次get 收集依赖
            Dep.target = null;
            return value;
        };
        Watcher.prototype.addDep = function (dep) {
            var id = dep.id;
            if (!this.depIds.has(id)) {
                dep.addSub(this);
            }
        };
        Watcher.prototype.update = function () {
            queueWatcher(this);
        };
        Watcher.prototype.run = function (cb) {
            var value = this.get();
            if (value !== this.value) {
                var oldValue = this.value;
                this.value = value;
                cb.call(this.vm, value, oldValue);
            }
        };
        return Watcher;
    }());

    function defineComputed(vm, key) {
        Object.defineProperty(vm, key, {
            enumerable: true,
            configurable: true,
            get: function () {
                var watcher = vm._computedWatchers && vm._computedWatchers[key];
                return watcher.value;
            },
        });
    }

    var uid$2 = 0;
    var Vue = /** @class */ (function () {
        function Vue(options) {
            this.id = 0;
            this.el = '';
            this._data = Object.create(null);
            this.methods = Object.create(null);
            this._computedWatchers = Object.create(null);
            this._watchers = [];
            this._updates = [];
            this.id = ++uid$2;
            this.vm = this;
            this._options = options;
            this._data = options.data;
            this.methods = options.methods;
            this.el = options.el;
            this.initData();
            this.initComputed(options.computed);
            this.$mount();
            callHook(this, 'mounted');
            this.initWatch(options.watch);
        }
        Vue.prototype.initData = function () {
            var keys = Object.keys(this._data);
            var i = keys.length;
            while (i--) {
                proxy(this, "_data", keys[i]);
            }
            new Observe(this._data);
        };
        Vue.prototype.$mount = function () {
            var el = document.querySelector(this.el);
            this._compile = new Compile(this, el);
            new Watcher(this, this._render, noop);
        };
        Vue.prototype._render = function () {
            var updates = this._updates;
            for (var i = 0; i < updates.length; i++) {
                updates[i]();
            }
        };
        Vue.prototype.initWatch = function (watch) {
            if (!watch || typeof watch !== 'object')
                return;
            var keys = Object.keys(watch);
            var i = keys.length;
            while (i--) {
                var key = keys[i];
                var cb = watch[key];
                new Watcher(this, key, cb);
            }
        };
        Vue.prototype.initComputed = function (computed) {
            if (!computed || typeof computed !== 'object')
                return;
            var keys = Object.keys(computed);
            var watchers = this._computedWatchers;
            var i = keys.length;
            while (i--) {
                var key = keys[i];
                var func = computed[key];
                watchers[key] = new Watcher(this, func || noop, noop);
                defineComputed(this, key);
            }
        };
        return Vue;
    }());

    window.Vue = Vue;

})));
//# sourceMappingURL=bundle.js.map
