<h1 align="center">Vue 源码学习</h1>
<p align="center"><a href="https://vuejs.org" target="_blank" rel="noopener noreferrer"><img width="100" src="https://vuejs.org/images/logo.png" alt="Vue logo"></a></p>

### 前言
> <p>  vue 无疑是一个非常棒的前端MVVM库，怀着好奇的心情开始看VUE源码，当然遇到了很多的疑问，也查了很多的资料看了一些文章。但是很多都忽略了很重要的部分或者是一些重要的细节，亦或者是一些很重要的部分没有指出。所以才打算写这篇文章，记录一下自己的学习过程，当然也希望能给其他想了解VUE源码的童鞋一点参考。如果有些地方笔者的理解错了，也欢迎指正出来，一起学习。</p>
---
<p>为了加深理解，我自己按着源码的思路造了一个简易的轮子，基本核心的实现都与VUE源代码一致，<a href="https://eltonchan.github.io/rollup-ts/index.html" >demo .</a>仓库的地址：<a href="https://github.com/eltonchan/rollup-ts">click me .</a> VUE的源码采用<a href="https://rollupjs.org/guide/en">rollup</a>和 <a href="https://flow.org/">flow</a>至于为什么不采用typescript，主要考虑工程上成本和收益的考量， 这一点尤大大在知乎也有说过。</p>
参考：<a href="">Vue 2.0 为什么选用 Flow 进行静态代码检查而不是直接使用 TypeScript？</a>
<p>不懂rollup 与typescript 也没关系，本项目已经配置好了， 只需要先执行npm i （或者cnpm i）安装相应依赖，然后 npm start 启动就可以。 npm run build 构建，默认是输出umd格式，如果需要cmd或者amd 可以在rollup.config.js配置文件修改。</p>

```
    output: {
        file: 'dist/bundle.js',
        format: 'umd',
        name: 'myBundle',
        sourcemap: true
    }
```

---

### question
带着问题学习一个事物往往能带来更好的效果，那我们就带着这几个问题开始学习之旅
- 如何对this.xxx的访问代理到this._data.xxx 上 ？
- 如何实现数据劫持，监听数据的读写操作 ？
- 如何实现依赖缓存 ？
- template 改变的时候 如何清理依赖项集合? eg:  v-if 、组件销毁
- 如何实现数据修改 dom更新 ?

---
> vue实现双向绑定原理，主要是利用<b>Object.defineProperty</b>和<b>发布订阅模式(定义了对象间的一对多的依赖关系，当一个对象的状态发生改变时，所有依赖于它的对象都将获得通知)，而在vue中，watcher 就是订阅者，而一对多的依赖关系 就是指data上的属性与watcher，而data上的属性如何与watcher 关联起来， dep 就是桥梁， 所以搞懂 dep, watcher, observe三者的关系，自然就搞懂了vue实现双向绑定的原理了</b>。
 
 ### 整体流程图
![avatar](/images/2.jpg)

### 一、 Proxy
> 回到第一个问题， 答案其实是：对于每一个 data 上的key，都在 vm 上做一个代理，实际操作的是 this._data、 实现的代码如下：

```
export function proxy (target: IVue, sourceKey: string, key: string) {
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
```
> 可以看出，其实获取和修改this.xx 其实都是在获取或者修改this.data.xx;
---
### Observer 用于把data上的属性封装成可观察的属性
> 用Object.defineProperty来拦截对象的读写gettet/setter操作， 在<b>获取的时候收集依赖</b>, 在修改的时候通知相关的依赖
```
    walk(data): void {
        if (!data || typeof data !== 'object') return;
        Object.keys(data).forEach(key => {
            this.defineReactive({
                data,
                key, 
                value: data[key]
            });
        });
    }

    defineReactive({ data, key, value }: IReactive): void {
        const dep = new Dep();
        this.walk(value);
        const self = this;
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: true,
            get() {
                if (Dep.target) {
                    Dep.target.addDep(dep);
                }
                return value;
            },
    
            set(newVal: any): void {
                if (value === newVal) return;
                self.walk(value);
                value = newVal;
                dep.notify();
            }
    
        });
    }
```

<p>可以看出, 在get的时候收集依赖，而Dep.target 其实就是watcher, 等下讲到watcher的时候再回过来， 这里要关注dep 其实dep在这里是一个闭包环境，在执行get 或者set的时候 还可以访问到创建的dep. eg: this.name 当在获取this.name 的值的时候 会创建一个Dep的实例， 把watcher 添加到这个dep中，</p>

![avatar](/images/3.jpg)

<p>那这边就有一个问题：为什么对象上新增属性不会监听，而修改整个对象为什么能检测到子属性的变化 ？</p>
<p>从源码就可以看出来了，<b>可观察的对象属性的添加或者删除无法触发set 方法，而直接修改对象则可以，而在set 方法中则会判断新值是否是对象数组类型，如果是 则子属性封装成可观察的属性，这也是set中self.walk(value);的作用。</b></p>

---

### Watcher
> 刚才提到了watcher，从上图中也可以看到了watcher的作用 事实上，每一个computed属性和watch 都会new 一个 Watcher。接下来会讲到。先来看watcher的实现。

```
    constructor(
        vm: IVue,
        expression: Function | string,
        cb: Function,
    ) {
        this.vm = vm;
        vm._watchers.push(this);

        this.cb = cb || noop;

        this.id = ++uid;

        // 处理watch 的情况
        if (typeof expression === 'function') {
            this.getter = expression;
        } else {
            this.getter = () => vm[expression];
        }

        this.expression = expression.toString();

        this.depIds = new Set();
        this.newDepIds = new Set();
        this.deps = [];
        this.newDeps = [];

        this.value = this.get();
    }
```
<p>这里的expression，对于初始化用来渲染视图的watcher来说，就是render方法，对于computed来说就是表达式，对于watch才是key，所以这边需要判断是字符串还是函数，而getter方法是用来取value的。这边有个depIds，deps，但是又有个newDepIds，newDeps，为什么这样设计，接下去再讲，先看this.value = this.get();可以看出在这里给watcher的value赋值，再来看get方法。</p>
```
    get() :void {
        Dep.target = this;
        const value = this.getter.call(this.vm); // 执行一次get 收集依赖
        Dep.target = null;
        this.cleanupDeps(); // 清除依赖
        return value;
    }
```
<p>可以看到getter是用来取值的，当执行这一行代码的时候，以render的那个watcher为例，会执行vNode render 当遇到{{ msg }}的表达式的时候，会取值，这个时候会触发msg的get方法，而此时的Dep.target 就是这个watcher， 所以我们会把这个render的watcher和msg这个属性关联起，也就是msg的dep已经有render的这个watcher了。这个就是Watcher，Dep，Observer的关系。我们再来看Dep</p>

```
export default class Dep implements IDep {
    static target: any = null;
    subs:any = [];
    id;

    constructor () {
        this.id = uid++;
        this.subs = [];
    }

    addSub(sub: IWatcher): void {
        if (this.subs.find(o => o.id === sub.id)) return;
        this.subs.push(sub);
    }

    removeSub (sub: IWatcher) {
        const idx = this.subs.findIndex(o => o.id === sub.id);
        if (idx >= 0) this.subs.splice(idx, 1);
    }

    notify():void {
        this.subs.forEach((sub: Isub) => {
            sub.update();
        })
    }

    depend () {
        if (Dep.target) {
            Dep.target.addDep(this);
        }
    }
}
```
<p>Dep的实现很简单，这边看notify的方法，我们知道在修改data上的属性的时候回触发set，然后触发notify方法，然后我们知道sub就是watcher，所以watcher.update方法就是修改属性所执行的方法，回到watcher看这个update的实现。</p>

```
    update() {
        // 推送到观察者队列中，下一个tick时调用。*/
        queueWatcher(this);
    }

    run(cb) {
        const value = this.get();
        if (value !== this.value) {
            const oldValue = this.value;
            this.value = value;
            cb.call(this.vm, value, oldValue);
        }
    }
```
<p>可以看出来，update方法并没有直接render vNode。而是把watcher推到一个队列中，事实上vue是的更新dom是异步的，为什么要异步更新队列，这边摘抄了一下官网的描述：<b>Vue 异步执行 DOM 更新。只要观察到数据变化，Vue 将开启一个队列，并缓冲在同一事件循环中发生的所有数据改变。如果同一个 watcher 被多次触发，只会被推入到队列中一次。这种在缓冲时去除重复数据对于避免不必要的计算和 DOM 操作上非常重要。然后，在下一个的事件循环“tick”中，Vue 刷新队列并执行实际 (已去重的) 工作。Vue 在内部尝试对异步队列使用原生的 Promise.then 和 MessageChannel，如果执行环境不支持，会采用 setTimeout(fn, 0) 代替。</b> 其实这是一种非常好的性能优化方案，我们设想一下如果在mounted中循环赋值，如果不采用异步更新策略，每一个赋值都更新，完全是一种浪费。</p>

---

### nextTick
> 关于nextTick其实很多文章写的都不错，这边就不详细介绍了。涉及到的概念可以点击下面链接查看
 - <a href="http://www.ruanyifeng.com/blog/2014/10/event-loop.html" >JavaScript 运行机制详解：再谈Event Loop</a>
 - <a href="https://github.com/ccforward/cc/issues/48" >关于 macrotask 和 microtask</a>

---

### Computed
> 回到开始的那个问题，如何实现依赖缓存？ name的更新如何让info也更新，如果name不变，info如何取值？
```
    computed: {
        info() {
            console.info('computed update');
            return this.name + 'hello';
        }
    },
```
<p>刚才在讲watcher的时候，提到过每个computed会实例化一个Watcher，从下面代码中也可以看出来，每一个computed属性都有一个订阅者watcher。</p>

```
    initComputed(computed) {
        if (!computed || typeof computed !== 'object') return;
        const keys = Object.keys(computed);
        const watchers = this._computedWatchers;
        let i = keys.length;
        while(i--) {
            const key = keys[i];
            const func = computed[key];
            watchers[key] = new Watcher(
                this,
                func || noop,
                noop,
            );

            defineComputed(this, key);
        }
    }
```
<p><b>可以看出来watcher 的getter方法就是computed属性的表达式，而在执行this.value = this.get();这个value就会是表达式的运行结果，所以其实Vue是把info的值存储在它的watcher的value里面的，然后又知道在取name的值的时候，会触发name的get方法，此时的Dep.target 就是这个info的watcher，而dep是一个闭包，还是之前收集name的那个dep， 所以name的dep就会有两个watcher，[renderWatcher, computedWatcher]， 当name更新的时候，这两个订阅者watcher都会收到通知，这也就是name的更新让info也更新。那info的值是watcher的value， 所以这边要做一个代理，把computed属性的取值代理到对应watcher的value，实现起来也很简单</b></p>  

```
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
```
---

### 依赖更新

```
    <p v-if="switch">{{ name }}</p>
```
<p>假设switch由true切换成false时候，是需要把name上面的renderWatcher删除掉的，所以需要用depIds和deps的属性来记录dep。</p>

```
    addDep(dep: Dep) {
        const id = dep.id;
        if (!this.newDepIds.has(id)) {
            this.newDepIds.add(id);
            this.newDeps.push(dep);
            if (!this.depIds.has(id)) {
                dep.addSub(this);
            }
        }
    }

    cleanupDeps() {
        let i = this.deps.length;
        while (i--) {
            const dep = this.deps[i];
            if (!this.depIds.has(dep.id)) {
                dep.removeSub(this);
            }
        }

        const tmp = this.depIds;
        this.depIds = this.newDepIds;
        this.newDepIds = tmp;
        this.newDepIds.clear();

        const deps = this.deps;
        this.deps = this.newDeps;
        this.newDeps = deps;
        this.newDeps.length = 0;
    }
```
<p>可以看出来，这里把newDepIds赋值给了depIds, 然后newDepIds再清空，deps也是这样的操作，这是一种效率很高的操作，避免使用了深拷贝。添加依赖的时候都是用newDepIds，newDeps来记录，删除的时候会去deps里面遍历查找，等删除了再把newDepIds赋值给depIds，这样能保证在更新依赖的时候，没有使用的依赖会从这个watcher中移除。
</p>

---

### watch

---

### Compile
> vue 2+ 已经使用VNode了，这部分还没有细致研究过，所以我这边自己写了个简易的Compile，这部分已经和源码没有关系了。主要用到了DocumentFragment和闭包而已，有兴趣的童鞋可以到这个<a href="https://github.com/eltonchan/rollup-ts" >仓库</a>查看。

---

*** components vnode 待补充···· ***