import { TEXTS } from '../data/texts.js';

/**
 * Barre supérieure : vies, état, pièces, score, record, progression.
 * `update` est appelée à chaque frame mais ne touche au DOM que si une valeur a changé.
 */
export class Hud {
    constructor(dom) {
        this.dom = dom;
        this.cache = {};
    }

    /** Écrit `value` dans `el` seulement si elle diffère de la dernière valeur affichée. */
    setText(key, el, value) {
        const str = String(value);
        if (this.cache[key] !== str) {
            this.cache[key] = str;
            el.textContent = str;
        }
    }

    /** @param {import('../core/Game.js').Game} game */
    update(game) {
        const d = this.dom;
        this.setText('lives', d.lives, `x${game.lives.lives}`);
        this.setText('coins', d.coins, game.score.coins);
        this.setText('score', d.score, String(Math.floor(game.score.score)).padStart(6, '0'));
        this.setText('best', d.best, game.score.best);
        this.setText('level', d.level, `1-${game.level}`);

        const isSuper = game.player.isSuper;
        if (this.cache.isSuper !== isSuper) {
            this.cache.isSuper = isSuper;
            const t = isSuper ? TEXTS.hud.super : TEXTS.hud.small;
            d.powerIcon.textContent = t.icon;
            d.powerText.textContent = t.text;
            d.powerBadge.classList.toggle('is-super', isSuper);
        }

        const pct = game.progressPercent;
        if (this.cache.pct !== pct) {
            this.cache.pct = pct;
            d.progressPct.textContent = `${pct}%`;
            d.progressBar.style.width = `${pct}%`;
        }
    }
}
