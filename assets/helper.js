/** @import * as messages1 from '../messages' */
/** @import * as messages from '../../repo/src/app/components/pure-trainer-layout/messages' */

export class Progress {
    /** @typedef {() => (void|boolean[])} onReplay */

    /**
     * 
     * @param {number} total 
     * @param {onReplay} onReplay 
     */
    constructor(total, onReplay) {
        this.#onReplay = onReplay;
        this.#total = total;
    }

    #current = 0;
    get current() {
        return this.#current;
    }
    /** @param {number} current */
    set current(current) {
        this.#current = current;
        this.#__available = Math.max(this.#__available, this.#current);
    }

    #__available = 0;
    get #available() {
        if (this.#onReplay?.()) return this.#total; else return this.#__available;
    }

    #total = 0;

    report() {
        Helper.post({
            message: 'progress',
            value: {
                available: this.#available,
                current: this.#current,
                total: this.#total,
                replay: this.#onReplay?.(),
            }
        });
    }

    /** @returns {Promise<number>} */
    async promise() {
        let listener;
        try {
            return await new Promise((resolve) => {
                listener = (e) => {
                    /** @type {messages.ChildReceives} */
                    const message = e.data;
                    switch (message.message) {
                        case 'progress':
                            resolve(message.value.current);
                            break;
                    }
                }
                window.addEventListener('message', listener);
            })
        } finally {
            window.removeEventListener('message', listener);
        }
    }

    /** @type {() => (void|boolean[])} */
    #onReplay;
}

export class Drag {
    /** @type {HTMLElement} */
    el;
    /** @type {number} */
    startIndex;
    /** @type {HTMLElement} */
    startParent;
    /** @type {HTMLEmbedElement} */
    parent;
    /** @type {HTMLImageElement} */
    relX;
    relY;
    constructor(el, e, relX, relY) {
        this.el = el;
        this.startIndex = Array.prototype.indexOf.call(el.parentElement.children, el);
        this.startParent = el.parentElement;
        this.parent = document.querySelector('.' + Drag.#dragParentClass);
        this.relX = relX;
        this.relY = relY;
        Drag.#current = this;

        this.pointermove = this.pointermove.bind(this);
        this.parent.addEventListener('pointermove', this.pointermove);
        this.pointerup = this.pointerup.bind(this);
        this.parent.addEventListener('pointerup', this.pointerup);
        this.parent.addEventListener('pointerleave', this.pointerup);

        if (getComputedStyle(this.parent).position === 'static') this.parent.style.position = 'relative';
        if (getComputedStyle(this.el).position !== 'absolute') this.el.style.position = 'absolute';

        this.setOwner(this.parent);
        this.pointermove(e);
        Drag.onStart?.(this);
    }

    count = 0;
    /**
     * @param {PointerEvent} e 
     */
    pointermove(e) {
        this.count += 1;
        if (this.count > 1) {
            if (this.count >= 9) this.count = 0;
            return;
        }
        
        const parentRect = this.parent.getBoundingClientRect();
        const left = e.pageX - parentRect.left - this.relX;
        const top = e.pageY - parentRect.top - this.relY;
        this.el.style.left = `${left}px`;
        this.el.style.top = `${top}px`;
        Drag.onMove?.(this);
        console.log('MOVE');
    }
    /**
     * @param {PointerEvent} e 
     */
    async pointerup(e) {
        this.parent.removeEventListener('pointermove', this.pointermove);
        this.parent.removeEventListener('pointerup', this.pointerup);
        this.parent.removeEventListener('pointerleave', this.pointerup);

        await Drag.onEnd?.(this);

        this.el.style.cursor = null;
        Drag.#current = undefined;

        Drag.onAfterEnd?.(this);
    }

    /** @param {HTMLElement} newOwner  */
    setOwner(newOwner, savePos = false) {
        const rect = this.el.getBoundingClientRect();
        this.el.remove();
        newOwner.appendChild(this.el);
        if (savePos) {
            const newRect = newOwner.getBoundingClientRect();

            const left = rect.left - newRect.left;
            const top = rect.top - newRect.top;
            this.el.style.left = `${left}px`;
            this.el.style.top = `${top}px`;
        }
    }

    removeAbsolute() {
        this.el.style.position = null;
        this.el.style.left = null;
        this.el.style.top = null;
    }

    return() {
        this.el.remove();
        if (this.startIndex >= this.startParent.children.length) {
            this.startParent.appendChild(this.el);
        } else {
            this.startParent.insertBefore(this.el, this.startParent.children[this.startIndex]);
        }
    }

    // STATIC BELLOW
    /** @type {(drag: Drag) => Promise<void>} */
    static onEnd;

    /** @type {(drag: Drag) => void} */
    static onStart;

    /** @type {(drag: Drag) => void} */
    static onMove;

    /** @type {(drag: Drag) => void} */
    static onAfterEnd;

    /** @type {string} */
    static #dragClass;
    /** @param {string} dragClass  */
    static set dragClass(dragClass) {
        this.#dragClass = dragClass;
        this.#init();
    }

    /** @type {string} */
    static #dragParentClass;
    /** @param {string} dragParentClass  */
    static set dragParentClass(dragParentClass) {
        this.#dragParentClass = dragParentClass;
        this.#init();
    }

    static #current = undefined;
    static get isBusy() {
        return !!Drag.#current;
    }

    /**
     * @param {PointerEvent} e 
     */
    static #pointerdown(e) {
        if (Drag.isBusy || !e.target?.classList?.contains(Drag.#dragClass)) return;

        const br = e.target.getBoundingClientRect();
        Drag.#current = new Drag(e.target, e, e.pageX - br.left, e.pageY - br.top);
    }

    static #inited = false;
    static #init() {
        if (this.#inited) return;
        if (this.#dragClass === undefined || this.#dragParentClass === undefined) return;
        document.body.addEventListener('pointerdown', Drag.#pointerdown);
        this.#inited = true;
    }
}

export class Helper {
    static DEBUG = (window.parent === window);

    /** @param {messages.ParentReceives} message  */
    static post(message) {
        if (this.DEBUG)
            console.log('Helper.post(message)', message);
        if (window.parent !== window)
            window.parent.postMessage(message, "*");
    }

    /** @type {(message: messages.ChildReceives) => void} */
    static listen;

    static {
        window.addEventListener('message', (e) => {
            /** @type {messages.ChildReceives} */
            const message = e.data;
            if (this.DEBUG) console.log('window message event: ', message);
            this.listen?.(message);
        });
    }

    /** @returns {Promise<messages.LoadParent['ParentAnswers'] | messages.LoadParent['ParentAsnwersReplay']>} */
    static async postLoad() {
        let listener;
        try {
            return await new Promise((resolve) => {
                listener = (e) => {
                    /** @type {messages.ChildReceives} */
                    const message = e.data;
                    switch (message.message) {
                        case 'instance':
                        case 'replay':
                            resolve(message);
                            break;
                    }
                }
                window.addEventListener('message', listener);
                this.post({
                    message: 'load'
                });
            })
        } finally {
            window.removeEventListener('message', listener);
        }
    }

    /** @param {messages.Result} result  */
    static postFinish(result) {
        this.post({
            message: 'finish',
            value: result,
        });
    }

    static setCheck(enabled = true) {
        this.post({
            message: 'check',
            value: {
                enabled,
            },
        });
    }

    /** manually triggers check promise */
    static triggerCheck() {
        window.postMessage({ message: 'check' }, '*');
    }
    /** @returns {Promise<void>} */
    static async check() {
        let listener;
        try {
            return await new Promise((resolve) => {
                listener = (e) => {
                    /** @type {messages.ChildReceives} */
                    const message = e.data;
                    switch (message.message) {
                        case 'check':
                            resolve();
                            break;
                    }
                }
                window.addEventListener('message', listener);
            })
        } finally {
            window.removeEventListener('message', listener);
        }
    }

    static async changeImg(img, change) {
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            change(img);
            if (img.complete) resolve();
        });

        return img;
    }

    /** 
     * @param {string} src
     * @returns {Promise<HTMLImageElement>} 
    */
    static loadImg(src) {
        return this.changeImg(document.createElement('img'), (img) => img.src = src);
    }

    /**
     * 
     * @param {HTMLElement} el1 
     * @param {HTMLElement} el2 
     */
    static intersectEls(el1, el2) {
        const rect1 = el1.getBoundingClientRect(), rect2 = el2.getBoundingClientRect();

        return (
            rect1.left <= rect2.right &&
            rect2.left <= rect1.right &&
            rect1.top <= rect2.bottom &&
            rect2.top <= rect1.bottom
        );
    }

    /** 
     * @param {Array<T>} array
     * @returns {Array<T>}
      */
    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    static deepEqual(a, b) {
        if ((typeof a == 'object' && a != null) && (typeof b == 'object' && b != null)) {
            var count = [0, 0];
            for (var key in a) count[0] += 1;
            for (var key in b) count[1] += 1;
            if (count[0] - count[1] != 0) { return false; }
            for (var key in a) {
                if (!(key in b) || !this.deepEqual(a[key], b[key])) { return false; }
            }
            for (var key in b) {
                if (!(key in a) || !this.deepEqual(b[key], a[key])) { return false; }
            }
            return true;
        } else {
            return a === b;
        }
    }

    static async fetchJSON(url) {
        return await (await fetch(url)).json();
    }
}