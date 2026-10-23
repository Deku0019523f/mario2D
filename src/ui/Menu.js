import { TEXTS } from '../data/texts.js';

/**
 * Écran central : accueil, pause, victoire, game over.
 * Le contenu d'accueil (sous-titre avec balisage) est relu depuis index.html au démarrage.
 */
export class Menu {
    /**
     * @param {object} dom éléments (voir ui/Dom.js)
     * @param {{onPlay: Function, onNext: Function, onResume: Function}} handlers
     */
    constructor(dom, { onPlay, onNext, onResume }) {
        this.dom = dom;
        this.startSubtitleHtml = dom.modalSubtitle.innerHTML;

        const bind = (btn, fn) =>
            btn.addEventListener('click', () => {
                btn.blur(); // évite qu'Espace (saut) ne « re-clique » le bouton resté focalisé
                fn();
            });
        bind(dom.btnPlay, onPlay);
        bind(dom.btnNextLevel, onNext);
        bind(dom.btnResume, onResume);
    }

    get visible() {
        return !this.dom.modalScreen.classList.contains('hidden');
    }

    hide() {
        this.dom.modalScreen.classList.add('hidden');
    }

    /** Affiche la carte avec les textes donnés. */
    render({ badge, title, subtitle, subtitleHtml, stats, playLabel, showNext = false, showResume = false }) {
        const d = this.dom;
        d.modalBadge.textContent = badge;
        d.modalTitle.textContent = title;
        if (subtitleHtml !== undefined) d.modalSubtitle.innerHTML = subtitleHtml;
        else d.modalSubtitle.textContent = subtitle;

        d.modalStats.classList.toggle('hidden', !stats);
        if (stats) {
            d.statFinalScore.textContent = stats.score;
            d.statFinalCoins.textContent = stats.coins;
            d.statFinalBest.textContent = stats.best;
        }

        d.btnPlay.textContent = playLabel;
        d.btnNextLevel.classList.toggle('hidden', !showNext);
        d.btnResume.classList.toggle('hidden', !showResume);
        d.modalScreen.classList.remove('hidden');
        this.focusPrimary();
    }

    showStart() {
        this.render({
            badge: TEXTS.start.badge,
            title: TEXTS.start.title,
            subtitleHtml: this.startSubtitleHtml,
            playLabel: TEXTS.start.play,
        });
    }

    showPause() {
        this.render({
            badge: TEXTS.pause.badge,
            title: TEXTS.pause.title,
            subtitle: TEXTS.pause.subtitle,
            playLabel: TEXTS.pause.play,
            showResume: true,
        });
    }

    /** @param {import('../core/Game.js').Game} game */
    showGameOver(game, reason) {
        this.render({
            badge: TEXTS.gameOver.badge,
            title: TEXTS.gameOver.title,
            subtitle: reason,
            stats: this.statsOf(game),
            playLabel: TEXTS.gameOver.play,
        });
    }

    /** @param {import('../core/Game.js').Game} game */
    showVictory(game, level) {
        this.render({
            badge: TEXTS.victory.badge(level),
            title: TEXTS.victory.title,
            subtitle: TEXTS.victory.subtitle,
            stats: this.statsOf(game),
            playLabel: TEXTS.victory.play,
            showNext: true,
        });
    }

    statsOf(game) {
        return {
            score: Math.floor(game.score.score),
            coins: game.score.coins,
            best: game.score.best,
        };
    }

    /** Bouton principal selon l'écran affiché (Reprendre > Niveau suivant > Jouer). */
    primaryButton() {
        const d = this.dom;
        if (!d.btnResume.classList.contains('hidden')) return d.btnResume;
        if (!d.btnNextLevel.classList.contains('hidden')) return d.btnNextLevel;
        return d.btnPlay;
    }

    focusPrimary() {
        try {
            this.primaryButton().focus({ preventScroll: true });
        } catch {
            // focus indisponible : sans conséquence
        }
    }

    /** Active le bouton principal (touche Entrée, bouton A de la manette). */
    confirm() {
        if (!this.visible) return false;
        this.primaryButton().click();
        return true;
    }
}
