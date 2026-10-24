import { Group, Mesh, MeshBasicMaterial, DoubleSide } from 'three';
import { ResourceBin } from './ResourceBin.js';
import { createPlatformMesh } from './meshes/platform.js';
import { createPipeMesh } from './meshes/pipe.js';
import { createBlockMesh } from './meshes/block.js';
import { createCoinMesh } from './meshes/coin.js';
import { createGoalMesh } from './meshes/goal.js';
import { createHillMesh, createCloudMesh, createFarHillMesh } from './meshes/scenery.js';
import { PLAYER, PHYSICS } from '../data/config.js';
import { MODE } from '../core/GameState.js';

/**
 * Construit les maillages d'un niveau à partir du monde logique et les synchronise à chaque frame.
 *
 *  - `rebuild(world)` libère l'ancien niveau (géométries, matériaux) puis crée le nouveau ;
 *  - `update(dt, game)` recopie positions / états / textures de la logique vers les maillages
 *    et anime le purement visuel : rotation des pièces, nuages, écrasement du héros, particules.
 *
 * La logique de jeu n'est jamais modifiée ici : le flux est à sens unique (logique -> rendu).
 */
export class SceneSync {
    /**
     * @param {object} deps
     * @param {import('three').Scene} deps.scene
     * @param {ReturnType<typeof import('./textures/index.js').createSpriteTextures>} deps.textures
     * @param {{sphereDetail: number}} deps.quality
     */
    constructor({ scene, textures, quality }) {
        this.scene = scene;
        this.textures = textures;
        this.quality = quality;

        this.levelGroup = new Group();
        this.scene.add(this.levelGroup);

        /** Ressources persistantes : héros, ombre, particules. */
        this.sharedBin = new ResourceBin({ detail: 1 });
        /** Ressources du niveau courant, libérées à chaque rebuild. */
        this.levelBin = null;

        this.version = -1;
        this.blockViews = [];
        this.coinViews = [];
        this.enemyViews = [];
        this.cloudViews = [];
        this.mushroomViews = new Map();
        this.particleViews = new Map();
        this.flagView = null;

        this.particleGeo = this.sharedBin.box(0.24, 0.24, 0.24);
        this.createPlayerView();
    }

    // ---------------------------------------------------------------- Héros

    createPlayerView() {
        this.playerGroup = new Group();
        this.scene.add(this.playerGroup);

        this.playerMat = this.sharedBin.track(
            new MeshBasicMaterial({
                map: this.textures.marioSmall.idle,
                transparent: true,
                alphaTest: 0.1,
                side: DoubleSide,
            }),
        );
        this.playerPlane = new Mesh(this.sharedBin.plane(PLAYER.SPRITE_SIZE, PLAYER.SPRITE_SIZE), this.playerMat);
        this.playerPlane.position.y = PLAYER.SPRITE_SIZE / 2;
        this.playerGroup.add(this.playerPlane);

        // Ombre elliptique projetée au sol sous le héros
        this.shadowMesh = new Mesh(
            this.sharedBin.circle(0.52, 16),
            this.sharedBin.basic({ color: 0x000000, transparent: true, opacity: 0.32 }),
        );
        this.shadowMesh.rotation.x = -Math.PI / 2;
        this.shadowMesh.position.y = 0.03;
        this.scene.add(this.shadowMesh);
    }

    // ---------------------------------------------------------------- Construction d'un niveau

    /** Sprite 2D (plan texturé) posé sur son bord inférieur. */
    createSprite(texture, size) {
        const mat = this.levelBin.track(
            new MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.1, side: DoubleSide }),
        );
        const mesh = new Mesh(this.levelBin.plane(size, size), mat);
        mesh.position.y = size / 2;
        const group = new Group();
        group.add(mesh);
        return { group, mesh, mat };
    }

    clearLevel() {
        for (const mesh of this.particleViews.values()) this.levelGroup.remove(mesh);
        this.particleViews.clear();
        while (this.levelGroup.children.length > 0) this.levelGroup.remove(this.levelGroup.children[0]);
        if (this.levelBin) this.levelBin.dispose();
        this.blockViews = [];
        this.coinViews = [];
        this.enemyViews = [];
        this.cloudViews = [];
        this.mushroomViews.clear();
        this.flagView = null;
    }

    /** @param {import('../world/World.js').World} world */
    rebuild(world) {
        this.clearLevel();
        const bin = (this.levelBin = new ResourceBin({ detail: this.quality.sphereDetail }));
        const add = (obj) => this.levelGroup.add(obj);

        // Décor d'arrière-plan : relief lointain, collines, nuages
        world.scenery.far.forEach((h) => add(createFarHillMesh(h, bin)));
        world.scenery.hills.forEach((h) => add(createHillMesh(h, bin)));
        world.scenery.clouds.forEach((c) => {
            const mesh = createCloudMesh(c, bin);
            add(mesh);
            this.cloudViews.push({ mesh, cloud: c });
        });

        // Terrain, tuyaux, blocs, pièces
        world.platforms.forEach((pl) => add(createPlatformMesh(pl, bin)));
        world.pipes.forEach((pipe) => add(createPipeMesh(pipe, bin)));
        world.blocks.forEach((block) => {
            const { group, core } = createBlockMesh(block, this.textures, bin);
            add(group);
            this.blockViews.push({ block, group, core });
        });
        world.coins.forEach((coin) => {
            const group = createCoinMesh(coin, bin);
            add(group);
            this.coinViews.push({ coin, group });
        });

        // Ennemis (sprites 2D)
        world.enemies.forEach((en) => {
            const set = en.type === 'koopa' ? this.textures.koopa : this.textures.goomba;
            const sprite = this.createSprite(set[0], en.size);
            sprite.group.position.set(en.x, en.y, 0.08);
            add(sprite.group);
            this.enemyViews.push({ enemy: en, ...sprite });
        });

        // Drapeau + château
        if (world.flag) {
            const { group, banner } = createGoalMesh(world.flag, this.textures, bin);
            add(group);
            this.flagView = { flag: world.flag, banner };
        }

        this.version = world.version;
    }

    // ---------------------------------------------------------------- Synchronisation à chaque frame

    /**
     * @param {number} dt durée réelle de la frame (s)
     * @param {import('../core/Game.js').Game} game
     */
    update(dt, game) {
        const world = game.world;
        if (world.version !== this.version) this.rebuild(world);
        const animDt = game.mode === MODE.PAUSED ? 0 : dt;

        this.syncBlocks();
        this.syncCoins(animDt, game.time);
        this.syncMushrooms(world);
        this.syncEnemies();
        this.syncParticles(world);
        if (this.flagView) this.flagView.banner.position.y = this.flagView.flag.bannerY;
        this.syncClouds(animDt);
        this.syncPlayer(game.player);
    }

    syncBlocks() {
        for (const v of this.blockViews) {
            const b = v.block;
            v.group.position.y = b.baseY + b.offsetY;
            v.group.visible = !b.destroyed;
            if (b.blockType === 'question' && b.used && v.core.material.map !== this.textures.qBlockUsed) {
                v.core.material.map = this.textures.qBlockUsed;
                v.core.material.needsUpdate = true;
            }
        }
    }

    syncCoins(animDt, time) {
        for (const v of this.coinViews) {
            const c = v.coin;
            v.group.visible = c.visible;
            if (c.collected) continue;
            v.group.rotation.y += 3.2 * animDt;
            v.group.position.y = c.baseY + Math.sin(time * 4 + c.phase) * 0.12;
        }
    }

    syncMushrooms(world) {
        for (const m of world.mushrooms) {
            let view = this.mushroomViews.get(m);
            if (!view) {
                view = this.createSprite(this.textures.mushroom, m.size);
                this.levelGroup.add(view.group);
                this.mushroomViews.set(m, view);
            }
            view.group.position.set(m.x, m.y, 0.08);
            view.group.visible = m.visible && !m.collected;
        }
    }

    syncEnemies() {
        for (const v of this.enemyViews) {
            const en = v.enemy;
            const set = en.type === 'koopa' ? this.textures.koopa : this.textures.goomba;
            const tex = en.state === 'squashed' ? set[2] : set[en.frame];
            if (v.mat.map !== tex) v.mat.map = tex;
            if (en.type === 'koopa' && en.state === 'walk') v.mesh.scale.x = en.vx > 0 ? 1 : -1;
            v.group.position.set(en.x, en.y, 0.08);
            v.group.visible = en.visible;
        }
    }

    syncParticles(world) {
        const alive = new Set();
        for (const p of world.particles) {
            alive.add(p.id);
            let mesh = this.particleViews.get(p.id);
            if (!mesh) {
                mesh = new Mesh(this.particleGeo, this.sharedBin.standard({ color: p.color, roughness: 0.4 }));
                this.levelGroup.add(mesh);
                this.particleViews.set(p.id, mesh);
            }
            mesh.position.set(p.x, p.y, p.z);
            mesh.rotation.set(p.rotX, p.rotY, 0);
            mesh.scale.setScalar(Math.max(0.01, p.life) * p.size);
        }
        for (const [id, mesh] of this.particleViews) {
            if (!alive.has(id)) {
                this.levelGroup.remove(mesh);
                this.particleViews.delete(id);
            }
        }
    }

    syncClouds(animDt) {
        for (const v of this.cloudViews) {
            v.mesh.position.x -= v.cloud.speed * animDt;
            if (v.mesh.position.x < -20) v.mesh.position.x = v.cloud.maxX;
        }
    }

    /** @param {ReturnType<typeof import('../player/Player.js').createPlayer>} p */
    syncPlayer(p) {
        const set = p.isSuper ? this.textures.marioSuper : this.textures.marioSmall;
        this.playerMat.map = set[p.pose] || set.idle;
        this.playerPlane.visible = p.visible;

        // Écrasement à l'atterrissage, étirement en l'air (squash & stretch)
        let sx = p.flipScaleX;
        let sy = p.scale;
        if (p.landTimer > 0) {
            const s = Math.sin((p.landTimer / 0.14) * Math.PI);
            sx *= 1 + 0.14 * s;
            sy *= 1 - 0.2 * s;
        } else if (!p.onGround) {
            const st = Math.max(-0.05, Math.min(0.08, p.vy * 0.005));
            sy *= 1 + st;
            sx *= 1 - st * 0.6;
        }
        this.playerGroup.position.set(p.x, p.y, 0.12);
        this.playerGroup.scale.set(sx, sy, 1);

        // Rebond de course et légère inclinaison vers l'avant
        const running = p.onGround && p.pose.startsWith('run');
        this.playerPlane.position.y = PLAYER.SPRITE_SIZE / 2 + (running ? Math.abs(Math.sin(p.animTimer * Math.PI)) * 0.05 : 0);
        this.playerPlane.rotation.z = running ? -Math.min(1, Math.abs(p.vx) / PHYSICS.MAX_SPEED_X) * 0.08 : 0;

        // Ombre portée
        this.shadowMesh.visible = p.shadow.visible;
        if (p.shadow.visible) {
            this.shadowMesh.position.set(p.shadow.x, p.shadow.y, 0.1);
            this.shadowMesh.scale.setScalar(p.shadow.scale);
        }
    }

    // ---------------------------------------------------------------- Nettoyage

    dispose() {
        this.clearLevel();
        this.scene.remove(this.levelGroup);
        this.scene.remove(this.playerGroup);
        this.scene.remove(this.shadowMesh);
        this.sharedBin.dispose();
    }
}
