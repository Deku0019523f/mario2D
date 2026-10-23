const MAX_ACTIVE = 24; // garde-fou : jamais plus de N textes simultanés
const LIFETIME_MS = 950;

/** Textes de score flottants (+100, SUPER MARIO !…) positionnés en pixels écran. */
export class FloatingText {
    /**
     * @param {HTMLElement} container
     * @param {Document} doc
     */
    constructor(container, doc = document) {
        this.container = container;
        this.doc = doc;
        this.timers = new Set();
    }

    /**
     * @param {{x:number,y:number}} screen position écran (px) du point d'ancrage
     * @param {string} text
     * @param {string} tone suffixe de classe de couleur, ex. 'amber-300'
     */
    spawn(screen, text, tone = 'amber-300') {
        while (this.container.children.length >= MAX_ACTIVE) {
            this.container.removeChild(this.container.firstChild);
        }
        const el = this.doc.createElement('div');
        el.className = `floating-score tone-${tone}`;
        el.style.left = `${screen.x - 24}px`;
        el.style.top = `${screen.y - 20}px`;
        el.textContent = text;
        this.container.appendChild(el);

        const timer = setTimeout(() => {
            this.timers.delete(timer);
            if (el.parentNode) el.parentNode.removeChild(el);
        }, LIFETIME_MS);
        this.timers.add(timer);
    }

    clear() {
        this.timers.forEach(clearTimeout);
        this.timers.clear();
        this.container.textContent = '';
    }
}
