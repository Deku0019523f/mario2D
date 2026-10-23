import { PHYSICS } from '../data/config.js';

/**
 * Boucle principale à pas de simulation FIXE avec accumulateur.
 *
 * La physique avance par pas de `fixedStep` secondes quel que soit le framerate (30, 60, 144 Hz…) :
 * le jeu se comporte donc de la même façon sur un téléphone modeste et sur un écran rapide.
 * Le rendu est appelé une fois par frame avec la durée réelle de la frame.
 */
export class GameLoop {
    /**
     * @param {object} deps
     * @param {(dt:number)=>void} deps.step simulation d'un pas fixe
     * @param {(frameDt:number, nowMs:number)=>void} deps.render rendu de la frame
     * @param {number} [deps.fixedStep]
     * @param {number} [deps.maxFrameTime] durée maximale prise en compte pour une frame (s)
     * @param {(cb:FrameRequestCallback)=>number} [deps.raf]
     * @param {(id:number)=>void} [deps.caf]
     */
    constructor({
        step,
        render,
        fixedStep = PHYSICS.FIXED_STEP,
        maxFrameTime = PHYSICS.MAX_FRAME_TIME,
        raf = (cb) => requestAnimationFrame(cb),
        caf = (id) => cancelAnimationFrame(id),
    }) {
        this.step = step;
        this.render = render;
        this.fixedStep = fixedStep;
        this.maxFrameTime = maxFrameTime;
        this.raf = raf;
        this.caf = caf;

        this.accumulator = 0;
        this.lastTime = null;
        this.handle = null;
        this.running = false;
        this.tick = this.tick.bind(this);
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = null;
        this.handle = this.raf(this.tick);
    }

    stop() {
        this.running = false;
        if (this.handle !== null) this.caf(this.handle);
        this.handle = null;
    }

    /** Appelée par requestAnimationFrame (ou directement par les tests). */
    tick(nowMs) {
        if (!this.running) return;
        this.handle = this.raf(this.tick);

        // Première frame, ou retour d'un onglet masqué : on repart sans « rattrapage »
        const frameDt = this.lastTime === null ? 0 : Math.min((nowMs - this.lastTime) / 1000, this.maxFrameTime);
        this.lastTime = nowMs;

        this.accumulator += frameDt;
        while (this.accumulator >= this.fixedStep) {
            this.step(this.fixedStep);
            this.accumulator -= this.fixedStep;
        }
        this.render(frameDt, nowMs);
    }
}
