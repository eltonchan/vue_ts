
import Watcher from './watcher';

export default class Compile {
    vm: object;
    el: Element;
    originEle: Element;
    fragment: Node | null;

    constructor(vm, el) {
        this.vm = vm;
        this.el = el;
        this.init();
    }

    init() {
        this.fragment = this.nodeToFragment(this.el);
        this.compileElement(this.fragment);
        this.el.appendChild(this.fragment);
    }

    nodeToFragment(el: Element) :Node {
        const fragment = document.createDocumentFragment();
        let child = el.firstChild;
        while (child) {
            // 将Dom元素移入fragment中
            fragment.appendChild(child);
            child = el.firstChild
        }
        return fragment;
    }

    compileElement(el) {
        const childNodes = el.childNodes;
        const self = this;
        [].slice.call(childNodes).forEach(function(node) {
            const reg = /\{\{(.*)\}\}/;
            const text = node.textContent;

            if (self.isElementNode(node)) {  
                self.compile(node);
            } else if (self.isTextNode(node) && reg.test(text)) {
                self.compileText(node, self.vm, reg.exec(text));
            }

            if (node.childNodes && node.childNodes.length) {
                self.compileElement(node);
            }
        });
    }

    compile (node) {
        const nodeAttrs = node.attributes;
        const self = this;
        Array.prototype.forEach.call(nodeAttrs, function(attr) {
            const attrName = attr.name;
            if (self.isDirective(attrName)) {
                const exp = attr.value;
                const idx = attrName.indexOf('@') === 0 ? 0 : 2;
                const dir = attrName.substring(idx);
                if (self.isEventDirective(dir)) {  // 事件指令
                    self.compileEvent(node, self.vm, exp, dir);
                } else {  // v-model 指令
                    self.compileModel(node, self.vm, exp);
                }
                // node.removeAttribute(attrName);
            }
        });
    }

    compileText(node, vm, expArray) {
        if (!Array.isArray(expArray) && !expArray[1]) return;
        const exp = expArray[1].trim();
        const self = this;
        const initText = this.vm[exp];
        this.updateText(node, initText);
        vm._updates.push(() => {
            const initText = this.vm[exp];
            self.updateText(node, initText);
        });
    }

    compileEvent (node, vm, exp, dir) {
        const eventType = dir.indexOf('@') >= 0 ? dir.substring(1) : dir.split(':')[1];
        const cb = vm.methods && vm.methods[exp];

        if (eventType && cb) {
            node.addEventListener(eventType, cb.bind(vm), false);
        }
    }

    compileModel(node, vm, exp) {
        const self = this;
        let val = this.vm[exp];
        this.modelUpdater(node, val);

        vm._updates.push(() => {
            let val = this.vm[exp];
            self.modelUpdater(node, val);
        });

        node.addEventListener('input', function(e) {
            const newValue = e.target.value;
            if (val === newValue) {
                return;
            }
            self.vm[exp] = newValue;
            val = newValue;
        });
    }

    updateText (node, value) {
        node.textContent = typeof value === 'undefined' ? '' : value;
    }

    modelUpdater(node, value) {
        node.value = typeof value === 'undefined' ? '' : value;
    }

    isDirective(attr) {
        return attr.indexOf('v-') === 0 || attr.indexOf('@') === 0;
    }

    isEventDirective(dir) {
        return dir.indexOf('on:') === 0 || dir.indexOf('@') === 0;
    }

    isElementNode (node) {
        return node.nodeType === 1;
    }

    isTextNode(node) {
        return node.nodeType === 3;
    }

}