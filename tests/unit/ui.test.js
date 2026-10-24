import test from 'node:test';
import assert from 'node:assert/strict';
import { createFakeDocument, createFakeDom } from '../helpers/fake-dom.js';
import { getDom, REQUIRED_IDS } from '../../src/ui/Dom.js';
import { Hud } from '../../src/ui/Hud.js';
import { Menu } from '../../src/ui/Menu.js';
import { UI } from '../../src/ui/UI.js';
import { FloatingText } from '../../src/ui/FloatingText.js';
import { createNewGame } from '../helpers/lockstep.js';
import { TEXTS } from '../../src/data/texts.js';
import { loseLife } from '../../src/player/playerStatus.js';

test('getDom : récupère tous les éléments, et signale explicitement ceux qui manquent', () => {
    const doc = createFakeDocument();
    const dom = getDom(doc);
    assert.equal(Object.keys(dom).length, Object.keys(REQUIRED_IDS).length);
    const broken = { getElementById: (id) => (id === 'hud-score' || id === 'btn-play' ? null : doc.getElementById(id)) };
    assert.throws(() => getDom(broken), /hud-score, btn-play/);
});

test('Hud : formate score sur 6 chiffres, vies, pièces, niveau, badge Super, progression', () => {
    const dom = createFakeDom();
    const hud = new Hud(dom);
    const { game } = createNewGame();
    game.startNewGame();
    game.score.add(1250);
    game.score.addCoin();
    hud.update(game);
    assert.equal(dom.score.textContent, '001250');
    assert.equal(dom.lives.textContent, 'x3');
    assert.equal(dom.coins.textContent, '1');
    assert.equal(dom.level.textContent, '1-1');
    assert.equal(dom.powerText.textContent, TEXTS.hud.small.text);

    game.player.isSuper = true;
    game.player.x = 64;
    hud.update(game);
    assert.equal(dom.powerText.textContent, TEXTS.hud.super.text);
    assert.equal(dom.powerBadge.classList.contains('is-super'), true);
    assert.equal(dom.progressPct.textContent, '50%');
    assert.equal(dom.progressBar.style.width, '50%');
});

test('Hud : n\'écrit dans le DOM que quand une valeur change', () => {
    const dom = createFakeDom();
    let writes = 0;
    let value = '';
    Object.defineProperty(dom.score, 'textContent', { get: () => value, set: (v) => { value = v; writes++; } });
    const hud = new Hud(dom);
    const { game } = createNewGame();
    hud.update(game);
    hud.update(game);
    hud.update(game);
    assert.equal(writes, 1);
});

test('Menu : accueil → partie → pause → game over → victoire : boutons et textes', () => {
    const dom = createFakeDom();
    const calls = [];
    const menu = new Menu(dom, { onPlay: () => calls.push('play'), onNext: () => calls.push('next'), onResume: () => calls.push('resume') });
    const startHtml = dom.modalSubtitle.innerHTML;
    const { game } = createNewGame();

    menu.showStart();
    assert.equal(menu.visible, true);
    assert.equal(dom.modalTitle.textContent, TEXTS.start.title);
    assert.equal(dom.modalSubtitle.innerHTML, startHtml, 'balisage d\'accueil préservé');
    assert.equal(menu.primaryButton(), dom.btnPlay);

    menu.showPause();
    assert.equal(dom.btnResume.classList.contains('hidden'), false);
    assert.equal(menu.primaryButton(), dom.btnResume);

    game.score.add(500);
    menu.showGameOver(game, 'Raison X');
    assert.equal(dom.modalSubtitle.textContent, 'Raison X');
    assert.equal(dom.statFinalScore.textContent, '500');
    assert.equal(dom.modalStats.classList.contains('hidden'), false);
    assert.equal(dom.btnResume.classList.contains('hidden'), true);

    menu.showVictory(game, 2);
    assert.equal(dom.modalBadge.textContent, TEXTS.victory.badge(2));
    assert.equal(menu.primaryButton(), dom.btnNextLevel);

    menu.hide();
    assert.equal(menu.visible, false);
    assert.equal(menu.confirm(), false, 'Entrée sans menu ne fait rien');

    menu.showStart();
    assert.equal(menu.confirm(), true);
    assert.deepEqual(calls, ['play']);
    assert.equal(dom.btnPlay.focused, false, 'le bouton est défocalisé après clic (Espace ne le re-déclenche pas)');
});

function uiSetup() {
    const doc = createFakeDocument();
    const dom = getDom(doc);
    const ctx = createNewGame();
    const audio = {
        engine: { muted: false },
        unlocked: 0,
        unlock() { this.unlocked++; },
        toggleMute() { this.engine.muted = !this.engine.muted; return this.engine.muted; },
    };
    const ui = new UI({ dom, bus: ctx.bus, game: ctx.game, project: (x, y) => ({ x: x * 10, y: y * 10 }), audio, doc });
    return { ui, dom, audio, ...ctx };
}

test('UI : le bouton Jouer lance la partie, masque le menu et débloque l\'audio', () => {
    const { dom, game, audio } = uiSetup();
    assert.equal(dom.modalScreen.classList.contains('hidden'), false);
    dom.btnPlay.click();
    assert.equal(game.mode, 'PLAYING');
    assert.equal(dom.modalScreen.classList.contains('hidden'), true);
    assert.equal(audio.unlocked, 1);
});

test('UI : pause / reprise via les boutons', () => {
    const { dom, game } = uiSetup();
    dom.btnPlay.click();
    dom.btnPause.click();
    assert.equal(game.mode, 'PAUSED');
    assert.equal(dom.modalTitle.textContent, TEXTS.pause.title);
    dom.btnResume.click();
    assert.equal(game.mode, 'PLAYING');
    assert.equal(dom.modalScreen.classList.contains('hidden'), true);
});

test('UI : bouton son — icône et état', () => {
    const { dom, audio } = uiSetup();
    assert.equal(dom.soundIcon.textContent, TEXTS.sound.on);
    dom.btnSound.click();
    assert.equal(audio.engine.muted, true);
    assert.equal(dom.soundIcon.textContent, TEXTS.sound.off);
});

test('UI : game over puis victoire affichent les écrans correspondants', () => {
    const { dom, game } = uiSetup();
    dom.btnPlay.click();
    loseLife(game, 'Plus de vies');
    loseLife(game, 'Plus de vies');
    loseLife(game, 'Plus de vies');
    assert.equal(game.mode, 'GAMEOVER');
    assert.equal(dom.modalTitle.textContent, TEXTS.gameOver.title);
    assert.equal(dom.modalSubtitle.textContent, 'Plus de vies');
    assert.equal(dom.modalStats.classList.contains('hidden'), false);

    dom.btnPlay.click(); // « Lancer la partie » : nouvelle partie
    assert.equal(game.mode, 'PLAYING');
    game.player.x = game.world.flag.x - 0.3;
    for (let i = 0; i < 240 * 12 && game.mode !== 'MENU'; i++) game.step(1 / 240);
    assert.equal(dom.modalTitle.textContent, TEXTS.victory.title);
    assert.equal(dom.btnNextLevel.classList.contains('hidden'), false);
    dom.btnNextLevel.click();
    assert.equal(game.mode, 'PLAYING');
    assert.equal(game.level, 2);
});

test('UI : les textes flottants sont projetés en pixels écran, plafonnés et nettoyés', async () => {
    const { dom, bus, ui } = uiSetup();
    bus.emit('fx:text', { x: 5, y: 3, text: '+100', tone: 'amber-300' });
    const el = dom.floatingContainer.children[0];
    assert.equal(el.textContent, '+100');
    assert.equal(el.style.left, '26px'); // 50 - 24
    assert.equal(el.style.top, '10px'); // 30 - 20
    for (let i = 0; i < 60; i++) bus.emit('fx:text', { x: 0, y: 0, text: String(i) });
    assert.ok(dom.floatingContainer.children.length <= 24);
    ui.dispose();
    assert.equal(dom.floatingContainer.textContent, '');
    bus.emit('fx:text', { x: 0, y: 0, text: 'x' });
    assert.equal(dom.floatingContainer.children.length, 0, 'plus d\'écoute après dispose');
});

test('FloatingText : le texte disparaît après sa durée de vie', async () => {
    const doc = createFakeDocument();
    const ft = new FloatingText(doc.dom.floatingContainer, doc);
    ft.spawn({ x: 0, y: 0 }, 'a');
    assert.equal(doc.dom.floatingContainer.children.length, 1);
    await new Promise((r) => setTimeout(r, 1050));
    assert.equal(doc.dom.floatingContainer.children.length, 0);
    assert.equal(ft.timers.size, 0);
});
