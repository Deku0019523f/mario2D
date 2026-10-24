/**
 * Test de fumée de bout en bout (vrai navigateur Chromium via Playwright).
 *
 * Vérifie : démarrage sans erreur console, boot du rendu WebGL, partie jouable au clavier,
 * pause automatique à la perte de focus, multitouch (CDP), portrait / paysage / redimensionnement,
 * et enregistre des captures dans docs/screenshots/.
 *
 * Usage : node tests/e2e/smoke.mjs [--dir dist]   (par défaut : sources, avec importmap)
 * Les résultats sont affichés tels quels ; le code de sortie vaut 1 au moindre échec.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startServer } from '../../scripts/serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dirArg = process.argv.indexOf('--dir');
const siteDir = path.resolve(ROOT, dirArg > 0 ? process.argv[dirArg + 1] : '.');
const SHOTS = path.join(ROOT, 'docs', 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const externalFailures = new Set();
function check(name, ok, detail = '') {
    results.push({ name, ok });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const { port, close } = await startServer({ root: siteDir, port: 0, host: '127.0.0.1' });
const base = `http://127.0.0.1:${port}/index.html`;

const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
});

async function open(contextOptions, query = '?debug&quality=low') {
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    const errors = [];
    // Les erreurs de chargement de ressources EXTERNES (polices Google Fonts, bloquées dans le bac à sable)
    // ne sont pas des erreurs du jeu : elles sont comptées à part et affichées.
    page.on('console', (m) => {
        if (m.type() !== 'error') return;
        const t = m.text();
        if (/ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED/.test(t)) externalFailures.add(t);
        else errors.push(t);
    });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(base + query, { waitUntil: 'load' });
    await page.waitForFunction(() => !!window.__mario, null, { timeout: 15000 });
    return { context, page, errors };
}
/** Attend (en temps réel) qu'une condition sur l'état du jeu soit vraie : robuste aux machines lentes (rendu logiciel). */
const until = (page, fnBody, timeout = 8000) =>
    page
        .waitForFunction(`(() => { const g = window.__mario.game; return (${fnBody}); })()`, null, { timeout, polling: 16 })
        .then(() => true, () => false);
const state = (page) =>
    page.evaluate(() => {
        const g = window.__mario.game;
        return { mode: g.mode, x: g.player.x, y: g.player.y, score: g.score.score, lives: g.lives.lives, onGround: g.player.onGround };
    });

try {
    // ------------------------------------------------------------ PC : clavier
    {
        const { context, page, errors } = await open({ viewport: { width: 1280, height: 720 } });
        check('PC : page chargée, objet de jeu exposé', true);
        const canvasOk = await page.evaluate(() => {
            const c = document.getElementById('game-canvas');
            return c.width > 0 && c.height > 0;
        });
        check('PC : canvas WebGL initialisé', canvasOk);
        await page.screenshot({ path: path.join(SHOTS, 'menu-pc.png') });

        await page.click('#btn-play');
        check('PC : clic sur Jouer -> mode PLAYING', (await state(page)).mode === 'PLAYING');
        const menuHidden = await page.evaluate(() => document.getElementById('modal-screen').classList.contains('hidden'));
        check('PC : le menu est masqué', menuHidden);

        const x0 = (await state(page)).x;
        await page.keyboard.down('ArrowRight');
        await until(page, `g.player.x > ${x0 + 2}`);
        await page.keyboard.up('ArrowRight');
        const x1 = (await state(page)).x;
        check('PC : flèche droite fait avancer le héros', x1 > x0 + 2, `x ${x0.toFixed(2)} -> ${x1.toFixed(2)}`);

        await page.keyboard.down('Space');
        await until(page, 'g.player.y > 0.5');
        const air = await state(page);
        check('PC : Espace fait sauter le héros', air.y > 0.3 && !air.onGround, `y=${air.y.toFixed(2)}`);
        await page.keyboard.up('Space');
        await until(page, 'g.player.onGround', 10000);

        // AZERTY
        const x2 = (await state(page)).x;
        await page.keyboard.down('d');
        await until(page, `g.player.x > ${x2 + 0.5}`);
        await page.keyboard.up('d');
        check('PC : touche D (AZERTY/WASD) fonctionne', (await state(page)).x > x2 + 0.5);

        // Pause clavier
        await page.keyboard.press('p');
        check('PC : touche P met en pause', (await state(page)).mode === 'PAUSED');
        const frozenX = (await state(page)).x;
        await page.waitForTimeout(300);
        check('PC : le jeu est figé en pause', (await state(page)).x === frozenX);
        await page.screenshot({ path: path.join(SHOTS, 'pause-pc.png') });
        await page.keyboard.press('p');
        check('PC : P reprend la partie', (await state(page)).mode === 'PLAYING');

        // Perte de focus -> pause automatique
        await page.evaluate(() => window.dispatchEvent(new Event('blur')));
        check('PC : perte de focus -> pause automatique', (await state(page)).mode === 'PAUSED');
        await page.click('#btn-resume');

        await page.screenshot({ path: path.join(SHOTS, 'jeu-pc.png') });
        check('PC : aucune erreur console', errors.length === 0, errors.join(' | '));
        await context.close();
    }

    // ------------------------------------------------------------ Android : tactile + multitouch
    {
        const { context, page, errors } = await open(
            { viewport: { width: 851, height: 393 }, deviceScaleFactor: 2.625, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36' },
            '?debug',
        );
        const q = await page.evaluate(() => window.__mario.quality.name);
        check('Android : palier de qualité mobile choisi automatiquement', q === 'medium' || q === 'low', q);
        const touchVisible = await page.evaluate(() => getComputedStyle(document.getElementById('touch-controls')).display !== 'none');
        check('Android : contrôles tactiles affichés', touchVisible);

        await page.tap('#btn-play');
        check('Android : tap sur Jouer -> PLAYING', (await state(page)).mode === 'PLAYING');
        await page.screenshot({ path: path.join(SHOTS, 'jeu-android-paysage.png') });

        const center = async (sel) => {
            const b = await page.locator(sel).boundingBox();
            return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
        };
        const right = await center('#btn-right');
        const jump = await center('#btn-jump');
        const cdp = await context.newCDPSession(page);
        const x0 = (await state(page)).x;
        // Deux doigts simultanés : ► et SAUT
        await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [
                { x: right.x, y: right.y, id: 1 },
                { x: jump.x, y: jump.y, id: 2 },
            ],
        });
        await until(page, `g.player.x > ${x0 + 0.3} && g.player.y > 0.2`);
        const mid = await state(page);
        check('Android : multitouch — courir ET sauter simultanément', mid.x > x0 + 0.3 && mid.y > 0.2, `x+${(mid.x - x0).toFixed(2)} y=${mid.y.toFixed(2)}`);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: right.x, y: right.y, id: 1 }] });
        await page.waitForTimeout(100);
        const heldJump = await page.evaluate(() => window.__mario.input.jumpHeld);
        const heldRight = await page.evaluate(() => window.__mario.input.right);
        check('Android : relâcher ► laisse le doigt de SAUT actif', heldJump === true && heldRight === false);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForTimeout(100);
        check('Android : tout relâché -> plus aucune entrée active', !(await page.evaluate(() => window.__mario.input.jumpHeld || window.__mario.input.right)));

        // Rotation portrait
        await page.setViewportSize({ width: 393, height: 851 });
        await page.waitForTimeout(400);
        const dims = await page.evaluate(() => {
            const c = document.getElementById('game-canvas');
            return { cw: c.clientWidth, ch: c.clientHeight, sw: document.documentElement.scrollWidth, iw: window.innerWidth };
        });
        check('Android : rotation portrait — canvas aux dimensions de l\'écran', Math.abs(dims.cw - 393) <= 1 && Math.abs(dims.ch - 851) <= 1, JSON.stringify(dims));
        check('Android : portrait — pas de défilement horizontal', dims.sw <= dims.iw, `${dims.sw} <= ${dims.iw}`);
        await page.screenshot({ path: path.join(SHOTS, 'jeu-android-portrait.png') });
        check('Android : aucune erreur console', errors.length === 0, errors.join(' | '));
        await context.close();
    }

    // ------------------------------------------------------------ Redimensionnement + visibilité
    {
        const { context, page, errors } = await open({ viewport: { width: 1024, height: 600 } });
        await page.click('#btn-play');
        for (const [w, h] of [[800, 600], [1920, 1080], [360, 640], [1024, 600]]) {
            await page.setViewportSize({ width: w, height: h });
            await page.waitForTimeout(150);
            const ok = await page.evaluate(
                ([W, H]) => {
                    const c = document.getElementById('game-canvas');
                    return Math.abs(c.clientWidth - W) <= 1 && Math.abs(c.clientHeight - H) <= 1;
                },
                [w, h],
            );
            check(`Redimensionnement ${w}x${h} : le canvas suit`, ok);
        }
        await page.evaluate(() => {
            Object.defineProperty(document, 'hidden', { value: true, configurable: true });
            document.dispatchEvent(new Event('visibilitychange'));
        });
        check('Onglet masqué -> pause automatique', (await state(page)).mode === 'PAUSED');
        check('Redimensionnement : aucune erreur console', errors.length === 0, errors.join(' | '));
        await context.close();
    }

    // ------------------------------------------------------------ Parcours de la partie (robot)
    {
        const { context, page, errors } = await open({ viewport: { width: 1280, height: 720 } });
        await page.click('#btn-play');
        // Le jeu tourne en temps réel : on laisse un robot appuyer sur → et sauter régulièrement.
        await page.keyboard.down('ArrowRight');
        let reachedScore = 0;
        for (let i = 0; i < 40; i++) {
            await page.keyboard.down('Space');
            await page.waitForTimeout(120);
            await page.keyboard.up('Space');
            await page.waitForTimeout(280);
            const s = await state(page);
            reachedScore = Math.max(reachedScore, s.score);
            if (s.mode !== 'PLAYING') break;
        }
        await page.keyboard.up('ArrowRight');
        const s = await state(page);
        check('Robot : le héros progresse dans le niveau', s.x > 8 || s.lives < 3, `x=${s.x.toFixed(1)} vies=${s.lives} score max=${reachedScore}`);
        check('Robot : aucune erreur console pendant la partie', errors.length === 0, errors.join(' | '));
        await context.close();
    }
} finally {
    await browser.close();
    await close();
}

const failed = results.filter((r) => !r.ok);
if (externalFailures.size) console.log(`\nNote : ${externalFailures.size} requête(s) externe(s) bloquée(s) par le réseau du bac à sable (polices Google Fonts), ignorée(s).`);
console.log(`\n${results.length - failed.length}/${results.length} vérifications réussies`);
process.exit(failed.length ? 1 : 0);
