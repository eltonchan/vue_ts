<h1 align="center">Vue 源码学习</h1>
<p align="center"><a href="https://vuejs.org" target="_blank" rel="noopener noreferrer"><img width="100" src="https://vuejs.org/images/logo.png" alt="Vue logo"></a></p>

### 前言
> <p>  vue 无疑是一个非常棒的前端MVVM库， 怀着好奇的心情开始看VUE源码，当然遇到了很多的疑问，也查了很多的资料看了一些文章。但是很多都忽略了很重要的部分或者是一些重要的细节，甚至只是把源码和注释翻译成中文贴出来。所以才打算写这篇文章，记录一下自己的学习过程，当然也希望能给其他想了解VUE源码的童鞋一点参考。如果有些地方笔者的理解错了，也欢迎指正出来，一起学习。</p>
---
<p>为了加深理解，我自己按着源码的思路造了一个简易的轮子，60%的实现都与VUE源代码一致，仓库的地址：<a href="https://github.com/eltonchan/rollup-ts">click me .</a> VUE的源码采用<a href="https://rollupjs.org/guide/en">rollup</a>和 <a href="https://flow.org/"> flow</a>至于为什么不采用typescript，主要考虑工程上成本和收益的考量， 这一点尤大大在知乎也有说过。</p>
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
### question ？
带着问题学习一个事物往往能带来更好的效果，那我们就带着这几个问题开始学习之旅、
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
可以看出，其实获取和修改this.xx 其实都是在获取或者修改this.data.xx;
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




