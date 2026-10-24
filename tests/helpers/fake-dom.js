/**
 * Faux DOM minimal pour tester l'interface et les contrôles sans navigateur.
 */

export function createEl(id = '') {
    const listeners = {};
    const el = {
        id,
        _text: '',
        get textContent() {
            return el._text;
        },
        /** Comme dans un vrai DOM : affecter textContent supprime les enfants. */
        set textContent(v) {
            el._text = String(v);
            if (el.children.length) el.children.length = 0;
        },
        innerHTML: '',
        className: '',
        style: {},
        children: [],
        parentNode: null,
        disabledFocus: false,
        focused: false,
        _classes: new Set(),
        classList: {
            add: (...c) => c.forEach((x) => el._classes.add(x)),
            remove: (...c) => c.forEach((x) => el._classes.delete(x)),
            toggle: (c, force) => {
                const on = force === undefined ? !el._classes.has(c) : !!force;
                if (on) el._classes.add(c);
                else el._classes.delete(c);
                return on;
            },
            contains: (c) => el._classes.has(c),
        },
        addEventListener(type, fn) {
            (listeners[type] ||= []).push(fn);
        },
        removeEventListener(type, fn) {
            listeners[type] = (listeners[type] || []).filter((f) => f !== fn);
        },
        /** Déclenche les écouteurs d'un type d'événement. */
        dispatch(type, event = {}) {
            const e = { preventDefault() {}, stopPropagation() {}, target: el, ...event };
            for (const fn of [...(listeners[type] || [])]) fn(e);
            return e;
        },
        listenerCount: (type) => (listeners[type] || []).length,
        click() {
            el.dispatch('click');
        },
        focus() {
            el.focused = true;
        },
        blur() {
            el.focused = false;
        },
        appendChild(c) {
            el.children.push(c);
            c.parentNode = el;
            return c;
        },
        removeChild(c) {
            const i = el.children.indexOf(c);
            if (i >= 0) el.children.splice(i, 1);
            c.parentNode = null;
            return c;
        },
        get firstChild() {
            return el.children[0] || null;
        },
        setPointerCapture() {},
        getBoundingClientRect: () => ({ left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 }),
    };
    return el;
}

/** Crée tous les éléments requis par src/ui/Dom.js. */
export function createFakeDom() {
    const ids = {
        canvas: 'game-canvas',
        floatingContainer: 'floating-container',
        bootError: 'boot-error',
        lives: 'hud-lives',
        powerBadge: 'hud-power-badge',
        powerIcon: 'hud-power-icon',
        powerText: 'hud-power-text',
        coins: 'hud-coins',
        level: 'hud-level',
        progressPct: 'hud-progress-pct',
        progressBar: 'hud-progress-bar',
        score: 'hud-score',
        best: 'hud-best',
        btnPause: 'btn-pause',
        btnSound: 'btn-sound',
        soundIcon: 'sound-icon',
        modalScreen: 'modal-screen',
        modalBadge: 'modal-badge',
        modalTitle: 'modal-title',
        modalSubtitle: 'modal-subtitle',
        modalStats: 'modal-stats',
        statFinalScore: 'stat-final-score',
        statFinalCoins: 'stat-final-coins',
        statFinalBest: 'stat-final-best',
        btnResume: 'btn-resume',
        btnPlay: 'btn-play',
        btnNextLevel: 'btn-next-level',
        touchControls: 'touch-controls',
        dpad: 'touch-dpad',
        btnLeft: 'btn-left',
        btnRight: 'btn-right',
        btnJump: 'btn-jump',
    };
    const dom = {};
    for (const [key, id] of Object.entries(ids)) dom[key] = createEl(id);
    // État initial conforme à index.html
    dom.btnResume.classList.add('hidden');
    dom.btnNextLevel.classList.add('hidden');
    dom.modalStats.classList.add('hidden');
    dom.modalSubtitle.innerHTML = 'Texte d\'accueil avec <b>balisage</b>';
    return dom;
}

/** `document` factice : getElementById + createElement. */
export function createFakeDocument(dom = createFakeDom()) {
    const byId = new Map(Object.values(dom).map((el) => [el.id, el]));
    return {
        dom,
        getElementById: (id) => byId.get(id) || null,
        createElement: (tag) => createEl(`<${tag}>`),
    };
}
