import { MODE, MODE_EVENT } from '../core/GameState.js';
import { TEXTS } from '../data/texts.js';
import { Hud } from './Hud.js';
import { Menu } from './Menu.js';
import { FloatingText } from './FloatingText.js';

/**
 * Interface : HUD, menus, boutons Pause / Son, textes flottants.
 * Réagit aux événements 'mode' et 'fx:text' du bus ; ne connaît ni Three.js ni Web Audio
 * (la projection monde -> écran et le son lui sont injectés).
 */
export class UI {
    /**
     * @param {object} deps
     * @param {object} deps.dom
     * @param {import('../core/events.js').EventBus} deps.bus
     * @param {import('../core/Game.js').Game} deps.game
     * @param {(x:number,y:number)=>{x:number,y:number}} deps.project monde -> pixels écran
     * @param {{toggleMute: () => boolean, unlock: () => void, engine: {muted: boolean}}} deps.audio
     * @param {Document} deps.doc
     */
    constructor({ dom, bus, game, project, audio, doc }) {
        this.dom = dom;
        this.game = game;
        this.audio = audio;
        this.project = project;

        this.hud = new Hud(dom);
        this.floating = new FloatingText(dom.floatingContainer, doc);
        this.menu = new Menu(dom, {
            onPlay: () => {
                audio.unlock();
                game.startNewGame();
            },
            onNext: () => {
                audio.unlock();
                game.startNextLevel();
            },
            onResume: () => game.resume(),
        });

        this.unsubscribers = [
            bus.on('mode', (mode, info) => this.onMode(mode, info)),
            bus.on('fx:text', ({ x, y, text, tone }) => this.floating.spawn(this.project(x, y), text, tone)),
        ];

        dom.btnSound.addEventListener('click', () => {
            const muted = audio.toggleMute();
            dom.soundIcon.textContent = muted ? TEXTS.sound.off : TEXTS.sound.on;
            dom.btnSound.blur();
        });
        dom.btnPause.addEventListener('click', () => {
            dom.btnPause.blur();
            game.togglePause();
        });

        dom.soundIcon.textContent = audio.engine.muted ? TEXTS.sound.off : TEXTS.sound.on;
        this.menu.showStart();
    }

    onMode(mode, info = {}) {
        switch (mode) {
            case MODE.PLAYING:
                this.menu.hide();
                break;
            case MODE.PAUSED:
                this.menu.showPause();
                break;
            case MODE.GAMEOVER:
                this.menu.showGameOver(this.game, info.reason);
                break;
            case MODE_EVENT.VICTORY:
                this.menu.showVictory(this.game, info.level);
                break;
            default:
                break;
        }
    }

    /** Appelée à chaque frame de rendu. */
    update() {
        this.hud.update(this.game);
    }

    dispose() {
        this.unsubscribers.forEach((off) => off());
        this.floating.clear();
    }
}
