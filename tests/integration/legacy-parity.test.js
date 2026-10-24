/**
 * NON-RÉGRESSION : compare la nouvelle version au code d'origine exécuté tel quel.
 * Si ces tests passent, le gameplay (physique, collisions, blocs, ennemis, score, vies, victoire)
 * est strictement identique à la version monolithique.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createLockstep, createBot, EPS } from '../helpers/lockstep.js';

const near = (a, b, msg) => assert.ok(Math.abs(a - b) <= EPS, `${msg}: ${a} != ${b}`);

test('le niveau 1 est identique à l\'original (colliders, blocs, pièces, ennemis, drapeau)', () => {
    const ls = createLockstep();
    const { L } = ls;
    const world = ls.game.world;

    // Colliders : même nombre, même ordre, mêmes dimensions
    assert.equal(world.colliders.length, L.api.colliders.length, 'nombre de colliders');
    world.colliders.forEach((c, i) => {
        const o = L.api.colliders[i];
        assert.equal(c.type, o.type, `collider ${i} type`);
        for (const k of ['minX', 'maxX', 'minY', 'maxY']) near(c[k], o[k], `collider ${i} ${k}`);
    });

    // Blocs
    assert.equal(world.blocks.length, L.api.interactiveBlocks.length, 'nombre de blocs');
    world.blocks.forEach((b, i) => {
        const o = L.api.interactiveBlocks[i];
        near(b.x, o.x, `bloc ${i} x`);
        near(b.baseY, o.baseY, `bloc ${i} baseY`);
        assert.equal(b.blockType, o.blockType);
        assert.equal(b.content, o.content);
    });

    // Pièces
    assert.equal(world.coins.length, L.api.coinsList.length, 'nombre de pièces');
    world.coins.forEach((c, i) => {
        near(c.x, L.api.coinsList[i].x, `pièce ${i} x`);
        near(c.y, L.api.coinsList[i].y, `pièce ${i} y`);
    });

    // Ennemis
    assert.equal(world.enemies.length, L.api.enemiesList.length, 'nombre d\'ennemis');
    world.enemies.forEach((e, i) => {
        const o = L.api.enemiesList[i];
        assert.equal(e.type, o.enemyType, `ennemi ${i} type`);
        for (const [mine, theirs] of [['x', 'x'], ['y', 'y'], ['vx', 'vx'], ['width', 'width'], ['height', 'height'], ['minX', 'patrolMinX'], ['maxX', 'patrolMaxX']]) {
            near(e[mine], o[theirs], `ennemi ${i} ${mine}`);
        }
    });

    // Drapeau et longueur du niveau
    near(world.flag.x, L.api.flagpoleObj.x, 'drapeau x');
    near(world.levelLength, L.game.levelLength, 'longueur du niveau');
});

test('partie jouée par un robot pendant 90 s (pas de 1/64 s) : trajectoire, score, vies et entités identiques image par image', () => {
    const ls = createLockstep();
    const bot = createBot();
    ls.start();

    const seen = { super: false, brickSmashed: false, stomp: false, gameOver: false, hit: false, coin: false };
    let restarts = 0;

    for (let f = 0; f < 64 * 90; f++) {
        const mode = ls.game.mode;
        if (mode === 'GAMEOVER') {
            seen.gameOver = true;
            // Quelques frames en Game Over (le monde continue de s'animer), puis nouvelle partie
            if (ls.frame % 30 === 0) {
                ls.start();
                restarts += 1;
            }
        }
        if (mode === 'PLAYING') ls.setInput(bot(ls.game));
        else ls.setInput({});

        const diff = ls.step();
        assert.equal(diff, null, `divergence à la frame ${ls.frame} (mode ${ls.game.mode}) -> ${diff}`);

        const p = ls.game.player;
        if (p.isSuper) seen.super = true;
        if (ls.game.world.blocks.some((b) => b.destroyed)) seen.brickSmashed = true;
        if (ls.game.world.enemies.some((e) => e.state === 'squashed')) seen.stomp = true;
        if (ls.game.score.coins > 0) seen.coin = true;
        if (ls.game.mode === 'WIN_ANIM') break;
    }

    // Garde-fou : la comparaison n'est pas « vide », elle a bien exercé les mécaniques clés
    assert.ok(seen.coin, 'le robot doit avoir collecté des pièces');
    assert.ok(seen.stomp, 'le robot doit avoir écrasé au moins un ennemi');
    assert.ok(ls.frame > 600, `la partie doit durer plus de 10 s (frames: ${ls.frame})`);
    console.log(`  ↳ ${ls.frame} frames comparées, ${restarts} redémarrage(s), états vus :`, JSON.stringify(seen));
});

test('bloc "?" -> Super Champignon -> brique fracassée : identiques à l\'original', () => {
    const ls = createLockstep();
    ls.start();
    ls.teleport(10.45, 0); // pile sous le premier bloc "?" (contenu : champignon)

    let mushroomSpawned = false;
    let supersSeen = false;
    let smashed = false;
    let teleported = false;

    for (let f = 0; f < 64 * 25 && !smashed; f++) {
        const p = ls.game.player;
        const w = ls.game.world;
        const mushroom = w.mushrooms.find((m) => !m.collected && !m.emerging);
        let input;
        if (!p.isSuper) {
            if (w.mushrooms.length === 0) {
                input = { jump: f % 40 < 22 }; // saute sous le bloc pour le frapper
            } else if (mushroom) {
                // poursuit le champignon (il rebrousse chemin contre les obstacles)
                input = { left: mushroom.x < p.x - 0.3, right: mushroom.x > p.x + 0.3 };
            } else {
                input = {};
            }
        } else {
            if (!teleported) {
                // Devenu Super : on va sous la rangée de briques du milieu du niveau (aucun ennemi proche)
                ls.teleport(51.5, 0);
                teleported = true;
            }
            const target = 51.5;
            input = {
                left: p.x > target + 0.3,
                right: p.x < target - 0.3,
                jump: Math.abs(p.x - target) < 0.8 && f % 30 < 18,
            };
        }
        ls.setInput(input);
        const diff = ls.step();
        assert.equal(diff, null, `divergence à la frame ${ls.frame} -> ${diff}`);
        if (w.mushrooms.length > 0) mushroomSpawned = true;
        if (ls.game.player.isSuper) supersSeen = true;
        if (w.blocks.some((b) => b.destroyed)) smashed = true;
        if (ls.game.mode !== 'PLAYING') break;
    }
    assert.ok(mushroomSpawned, 'un champignon doit être sorti d\'un bloc "?"');
    assert.ok(supersSeen, 'le héros doit être devenu Super en le ramassant');
    assert.ok(smashed, 'une brique doit avoir été fracassée en mode Super');
});

test('victoire : drapeau, animation de marche, +2000, puis niveau suivant (garde le Super Champignon)', () => {
    const ls = createLockstep();
    ls.start();
    // On devient Super dans les deux versions avant d'atteindre le drapeau
    ls.L.game.isSuper = true;
    ls.L.game.targetScale = 1.45;
    ls.game.player.isSuper = true;
    ls.game.player.targetScale = 1.45;

    ls.teleport(124, 0);
    ls.setInput({ right: true });
    let reachedWin = false;
    for (let f = 0; f < 64 * 15; f++) {
        const diff = ls.step();
        assert.equal(diff, null, `divergence à la frame ${ls.frame} -> ${diff}`);
        if (ls.game.mode === 'WIN_ANIM') reachedWin = true;
        if (reachedWin && ls.game.mode === 'MENU') break;
    }
    assert.ok(reachedWin, 'l\'animation de victoire doit démarrer');
    assert.equal(ls.game.mode, 'MENU', 'retour au menu après la victoire');
    assert.ok(ls.game.score.score >= 2000, 'bonus de victoire attribué');

    // Niveau suivant : le Super Champignon est conservé, même état des deux côtés
    ls.setInput({});
    ls.nextLevel();
    assert.equal(ls.game.mode, 'PLAYING');
    assert.equal(ls.game.level, 2);
    assert.equal(ls.L.game.level, 2);
    assert.equal(ls.game.player.isSuper, true, 'Super conservé');
    assert.equal(ls.L.game.isSuper, true);
    for (let f = 0; f < 120; f++) {
        const diff = ls.step();
        assert.equal(diff, null, `divergence (niveau 2) à la frame ${ls.frame} -> ${diff}`);
    }
});

test('chute dans un ravin : perte de vie puis Game Over identiques', () => {
    const ls = createLockstep();
    ls.start();
    for (let life = 0; life < 3; life++) {
        // Au-dessus du fossé entre les deux plateformes, sans rien pour amortir la chute
        ls.teleport(29.2, -3);
        ls.L.game.invincibleTimer = 0;
        ls.game.player.invincibleTimer = 0;
        ls.setInput({});
        for (let f = 0; f < 90 && ls.game.mode === 'PLAYING'; f++) {
            const diff = ls.step();
            assert.equal(diff, null, `divergence à la frame ${ls.frame} -> ${diff}`);
            if (ls.game.player.y < -5.4 || ls.game.lives.lives < 3 - life) break;
        }
    }
    assert.equal(ls.game.mode, 'GAMEOVER');
    assert.equal(ls.L.game.mode, 'GAMEOVER');
    assert.equal(ls.game.lives.lives, 0);
});

test('dégâts : un Super rétrécit, un petit perd une vie, invincibilité temporaire identiques', () => {
    const ls = createLockstep();
    ls.start();
    // Super dans les deux versions
    ls.L.game.isSuper = true;
    ls.L.game.targetScale = 1.45;
    ls.L.game.scale = 1.45;
    ls.game.player.isSuper = true;
    ls.game.player.targetScale = 1.45;
    ls.game.player.scale = 1.45;

    // Se place sur un Goomba (contact latéral, pas d'écrasement : vy = 0)
    const goomba = ls.game.world.enemies[0];
    ls.teleport(goomba.x, 0);
    ls.L.game.invincibleTimer = 0;
    ls.game.player.invincibleTimer = 0;
    ls.setInput({});

    let shrank = false;
    let lostLife = false;
    for (let f = 0; f < 64 * 8; f++) {
        const diff = ls.step();
        assert.equal(diff, null, `divergence à la frame ${ls.frame} -> ${diff}`);
        if (!ls.game.player.isSuper) shrank = true;
        if (ls.game.lives.lives < 3) lostLife = true;
        // Une fois petit et l'invincibilité terminée, on se repositionne sur un ennemi pour perdre une vie
        if (shrank && !lostLife && ls.game.player.invincibleTimer <= 0) {
            const g = ls.game.world.enemies.find((e) => e.state === 'walk');
            ls.teleport(g.x, g.y);
        }
        if (lostLife) break;
    }
    assert.ok(shrank, 'le Super doit rétrécir au premier contact');
    assert.ok(lostLife, 'le petit doit perdre une vie au contact suivant');
    assert.equal(ls.game.lives.lives, ls.L.game.lives);
});
