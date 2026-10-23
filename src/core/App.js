import { EventBus } from './events.js';
import { Game } from './Game.js';
import { GameLoop } from './GameLoop.js';
import { createStorage, getLocalStorage } from '../systems/Storage.js';
import { Settings } from '../systems/Settings.js';
import { SoundEngine } from '../audio/SoundEngine.js';
import { AudioManager } from '../audio/AudioManager.js';
import { InputManager } from '../controls/InputManager.js';
import { Keyboard } from '../controls/Keyboard.js';
import { TouchControls } from '../controls/TouchControls.js';
import { GamepadInput } from '../controls/GamepadInput.js';
import { getDom } from '../ui/Dom.js';
import { UI } from '../ui/UI.js';
import { resolveQuality } from '../rendering/quality.js';
import { Renderer } from '../rendering/Renderer.js';
import { SceneSync } from '../rendering/SceneSync.js';
import { createSpriteTextures } from '../rendering/textures/index.js';

/**
 * Assemble l'application dans un ORDRE DÉTERMINISTE :
 *
 *   1. stockage + réglages        5. rendu (Renderer, textures, SceneSync)
 *   2. bus d'événements + entrées 6. interface (HUD, menus) + contrôles
 *   3. logique de jeu (Game)      7. liaison des événements système (focus, visibilité)
 *   4. audio                      8. boucle principale
 *
 * @param {{win?: Window, doc?: Document}} [env]
 * @returns {{start: () => void, stop: () => void, dispose: () => void, game: Game, input: InputManager}}
 */
export function createApp({ win = window, doc = document } = {}) {
    // 1. Stockage et réglages
    const storage = createStorage(getLocalStorage(win));
    const settings = new Settings(storage);

    // 2. Bus et entrées
    const bus = new EventBus();
    const input = new InputManager();

    // 3. Logique de jeu
    const game = new Game({ bus, storage, input });
    game.init();

    // 4. Audio
    const engine = new SoundEngine({ muted: settings.muted });
    const audio = new AudioManager({ bus, engine, settings });

    // 5. Rendu (peut lever une erreur si WebGL est indisponible : main.js l'affiche)
    const dom = getDom(doc);
    const nav = win.navigator || {};
    const quality = resolveQuality({
        search: win.location ? win.location.search : '',
        userAgent: nav.userAgent,
        deviceMemory: nav.deviceMemory,
        hardwareConcurrency: nav.hardwareConcurrency,
        maxTouchPoints: nav.maxTouchPoints,
    });
    const renderer = new Renderer({ canvas: dom.canvas, rig: game.cameraRig, quality, win });
    const textures = createSpriteTextures({ doc });
    const sceneSync = new SceneSync({ scene: renderer.scene, textures, quality });

    // 6. Interface et contrôles
    const ui = new UI({ dom, bus, game, project: (x, y) => renderer.project(x, y), audio, doc });

    const keyboard = new Keyboard(input, win);
    keyboard.attach();
    const touch = new TouchControls({
        input,
        elements: { dpad: dom.dpad, btnLeft: dom.btnLeft, btnRight: dom.btnRight, btnJump: dom.btnJump },
        onFirstTouch: () => audio.unlock(),
    });
    touch.attach();
    const gamepad = new GamepadInput(input, nav);

    input.on('jumpPress', () => game.queueJump());
    input.on('jumpRelease', () => game.releaseJump());
    input.on('pause', () => game.togglePause());
    input.on('confirm', () => ui.menu.confirm());

    // Déverrouillage audio au premier geste (exigé par les navigateurs mobiles)
    const unlockOnce = () => audio.unlock();
    win.addEventListener('pointerdown', unlockOnce, { once: true });
    win.addEventListener('keydown', unlockOnce, { once: true });

    // 7. Perte de focus / onglet masqué : pause automatique et relâchement des touches
    const onHidden = () => {
        input.releaseAll();
        game.pause();
    };
    const onVisibility = () => {
        if (doc.hidden) onHidden();
    };
    win.addEventListener('blur', onHidden);
    doc.addEventListener('visibilitychange', onVisibility);

    // 8. Boucle principale
    const loop = new GameLoop({
        step: (dt) => game.step(dt),
        render: (frameDt) => {
            gamepad.poll();
            game.updateCamera(frameDt);
            sceneSync.update(frameDt, game);
            ui.update();
            renderer.render(frameDt);
        },
        raf: (cb) => win.requestAnimationFrame(cb),
        caf: (id) => win.cancelAnimationFrame(id),
    });

    return {
        game,
        input,
        renderer,
        sceneSync,
        ui,
        audio,
        quality,
        loop,
        start: () => loop.start(),
        stop: () => loop.stop(),
        dispose() {
            loop.stop();
            keyboard.detach();
            touch.detach();
            win.removeEventListener('blur', onHidden);
            doc.removeEventListener('visibilitychange', onVisibility);
            ui.dispose();
            audio.dispose();
            sceneSync.dispose();
            textures.dispose();
            renderer.dispose();
            bus.clear();
        },
    };
}
