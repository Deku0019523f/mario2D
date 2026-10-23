import { PHYSICS, PLAYER } from '../data/config.js';
import { TEXTS } from '../data/texts.js';
import { resolveSide, resolveVertical, findGroundBelow } from '../physics/collision.js';
import { triggerBlockHit } from '../objects/Block.js';
import { loseLife } from './playerStatus.js';
import { choosePose } from './playerAnimation.js';

/**
 * Un pas de simulation du héros (déplacement, saut, collisions, animation, arrivée au drapeau).
 * Port fidèle de `updatePlayerPhysics` de la version d'origine, appelé à pas fixe.
 *
 * @param {import('../core/Game.js').Game} game
 * @param {number} dt pas de simulation (s)
 */
export function updatePlayer(game, dt) {
    const p = game.player;
    const input = game.input;
    const world = game.world;

    // Animation de changement de taille (Petit <-> Super)
    p.scale += (p.targetScale - p.scale) * Math.min(1, PLAYER.SCALE_LERP * dt);
    const playerW = PLAYER.WIDTH * (p.isSuper ? PLAYER.SUPER_WIDTH_MULT : 1);
    const playerH = PLAYER.HEIGHT * p.scale;
    const halfW = playerW / 2;

    // Clignotement d'invincibilité
    if (p.invincibleTimer > 0) {
        p.invincibleTimer -= dt;
        p.visible = p.invincibleTimer <= 0 || Math.floor(p.invincibleTimer * PLAYER.BLINK_RATE) % 2 === 0;
    } else {
        p.visible = true;
    }
    if (p.landTimer > 0) p.landTimer = Math.max(0, p.landTimer - dt);

    // Déplacement horizontal
    let inputDir = 0;
    if (input.left) inputDir -= 1;
    if (input.right) inputDir += 1;

    if (inputDir !== 0) {
        p.vx += inputDir * PHYSICS.MOVE_ACCEL * dt;
        p.facing = inputDir;
    } else {
        const decel = Math.min(Math.abs(p.vx), PHYSICS.FRICTION * dt);
        p.vx -= Math.sign(p.vx) * decel;
        if (Math.abs(p.vx) < 0.08) p.vx = 0;
    }
    p.vx = Math.max(-PHYSICS.MAX_SPEED_X, Math.min(PHYSICS.MAX_SPEED_X, p.vx));

    // Coyote time & jump buffer (sauts réactifs au clavier comme au tactile)
    const wasGrounded = p.onGround;
    if (p.onGround) p.coyoteTimer = PHYSICS.COYOTE_TIME;
    else p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);

    if (p.jumpBuffer > 0) p.jumpBuffer -= dt;

    if (p.jumpBuffer > 0 && p.coyoteTimer > 0) {
        p.vy = p.isSuper ? PHYSICS.JUMP_VELOCITY * PHYSICS.SUPER_JUMP_MULT : PHYSICS.JUMP_VELOCITY;
        p.onGround = false;
        p.coyoteTimer = 0;
        p.jumpBuffer = 0;
        game.sfx('jump', p.isSuper);
    }

    // Gravité dynamique : saut plus haut si on maintient le bouton
    const gravity = p.vy > 0 && input.jumpHeld ? PHYSICS.GRAVITY * PHYSICS.HOLD_JUMP_GRAVITY_MULT : PHYSICS.GRAVITY;
    p.vy += gravity * dt;
    if (p.vy < PHYSICS.MAX_FALL_SPEED) p.vy = PHYSICS.MAX_FALL_SPEED;

    // Mouvement X + collisions latérales
    p.x += p.vx * dt;
    if (p.x < PHYSICS.LEFT_BOUND) {
        p.x = PHYSICS.LEFT_BOUND;
        p.vx = 0;
    }
    resolveSide(p, halfW, playerH, world.colliders);

    // Mouvement Y + collisions verticales (sol, plafond, blocs)
    const prevY = p.y;
    p.y += p.vy * dt;
    const impactVy = p.vy;
    p.onGround = false;
    resolveVertical(
        p,
        prevY,
        halfW,
        playerH,
        world.colliders,
        (collider) => {
            if (collider.type === 'block' && collider.block) triggerBlockHit(game, collider.block);
            else game.sfx('bump');
        },
        PHYSICS.HEAD_BUMP_VY,
    );

    // Atterrissage marqué : écrasement du sprite + petit nuage de poussière
    if (p.onGround && !wasGrounded && impactVy < -8) {
        p.landTimer = 0.14;
        game.burst(p.x, p.y + 0.05, 0xffffff, 4, { size: 0.55, speed: 0.45 });
    }

    // Chute dans un ravin
    if (p.y < PHYSICS.FALL_DEATH_Y) {
        loseLife(game, TEXTS.reasons.pit);
        return;
    }

    // Pose du sprite
    if (p.onGround && Math.abs(p.vx) > 0.35) p.animTimer += dt * (4 + Math.abs(p.vx) * 1.3);
    p.pose = choosePose(p);

    // Retournement horizontal fluide façon Paper Mario
    const targetFlip = p.facing * p.scale;
    p.flipScaleX += (targetFlip - p.flipScaleX) * Math.min(1, 18 * dt);

    // Ombre portée au sol
    const groundY = findGroundBelow(p.x, p.y, world.colliders);
    if (groundY !== null) {
        const heightDiff = Math.max(0, p.y - groundY);
        p.shadow.visible = true;
        p.shadow.x = p.x;
        p.shadow.y = groundY + 0.03;
        p.shadow.scale = Math.max(0.3, 1 - heightDiff * 0.12) * p.scale;
    } else {
        p.shadow.visible = false;
    }

    // Arrivée au drapeau
    if (world.flag && !world.flag.triggered && p.x >= world.flag.x - 0.5) {
        game.startWinAnimation();
    }
}
