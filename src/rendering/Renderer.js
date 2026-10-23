import {
    WebGLRenderer,
    Scene,
    FogExp2,
    PerspectiveCamera,
    AmbientLight,
    HemisphereLight,
    DirectionalLight,
    PCFSoftShadowMap,
    CanvasTexture,
    Vector3,
} from 'three';
import { CAMERA, COLORS } from '../data/config.js';

/** Dégradé de ciel (haut -> horizon) utilisé comme fond de scène. */
function createSkyTexture(doc) {
    const canvas = doc.createElement('canvas');
    canvas.width = 16;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#1d9bf0');
    grad.addColorStop(0.55, '#38bdf8');
    grad.addColorStop(1, '#a5e3fb');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 256);
    return new CanvasTexture(canvas);
}

/**
 * Moteur de rendu Three.js : scène, lumières, caméra, redimensionnement, résolution adaptative.
 * Ne contient aucune logique de jeu : la caméra reflète simplement `rig` (CameraRig).
 */
export class Renderer {
    /**
     * @param {object} deps
     * @param {HTMLCanvasElement} deps.canvas
     * @param {import('../core/CameraRig.js').CameraRig} deps.rig
     * @param {object} deps.quality réglages (voir data/config.js QUALITY_PRESETS)
     * @param {Window} deps.win
     */
    constructor({ canvas, rig, quality, win = window }) {
        this.canvas = canvas;
        this.rig = rig;
        this.quality = quality;
        this.win = win;
        this.doc = canvas.ownerDocument;

        this.renderer = new WebGLRenderer({
            canvas,
            antialias: quality.antialias,
            powerPreference: 'high-performance',
        });
        this.renderer.shadowMap.enabled = quality.shadows;
        this.renderer.shadowMap.type = PCFSoftShadowMap;

        this.scene = new Scene();
        this.skyTexture = createSkyTexture(this.doc);
        this.scene.background = this.skyTexture;
        this.scene.fog = new FogExp2(COLORS.FOG, COLORS.FOG_DENSITY);

        this.camera = new PerspectiveCamera(CAMERA.FOV, 1, CAMERA.NEAR, CAMERA.FAR);
        this.camera.position.set(rig.x, rig.y, rig.z);

        this.createLights();

        // Résolution adaptative : si l'appareil peine, on baisse le pixel ratio
        this.maxPixelRatio = quality.maxPixelRatio;
        this.pixelRatio = Math.min(win.devicePixelRatio || 1, this.maxPixelRatio);
        this.frameMsAvg = 16;
        this.slowFrames = 0;
        this.cooldown = 0;

        this.onContextLost = (e) => e.preventDefault(); // autorise la restauration automatique
        canvas.addEventListener('webglcontextlost', this.onContextLost);

        this.tmp = new Vector3();
        this.handleResize = this.handleResize.bind(this);
        win.addEventListener('resize', this.handleResize);
        win.addEventListener('orientationchange', this.handleResize);
        if (typeof win.ResizeObserver === 'function') {
            this.resizeObserver = new win.ResizeObserver(this.handleResize);
            this.resizeObserver.observe(canvas);
        }
        this.handleResize();
    }

    createLights() {
        const q = this.quality;
        this.scene.add(new AmbientLight(0xffffff, 0.65));

        const hemi = new HemisphereLight(0xfffbeb, 0x22c55e, 0.55);
        hemi.position.set(0, 40, 0);
        this.scene.add(hemi);

        this.sun = new DirectionalLight(0xfff7ed, 0.95);
        this.sun.position.set(20, 35, 22);
        this.sun.castShadow = q.shadows;
        const s = this.sun.shadow;
        s.mapSize.width = q.shadowMapSize;
        s.mapSize.height = q.shadowMapSize;
        s.camera.near = 2;
        s.camera.far = 110;
        const d = 26;
        s.camera.left = -d;
        s.camera.right = d;
        s.camera.top = d;
        s.camera.bottom = -d;
        s.bias = -0.0005;
        this.scene.add(this.sun);
    }

    /** Taille réelle du canvas (CSS px) avec repli sur la fenêtre. */
    measure() {
        const w = this.canvas.clientWidth || this.win.innerWidth || 800;
        const h = this.canvas.clientHeight || this.win.innerHeight || 600;
        return { w, h };
    }

    handleResize() {
        const { w, h } = this.measure();
        this.camera.aspect = w / h;
        this.rig.setAspect(this.camera.aspect);
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(w, h, false); // le CSS (position: fixed; inset: 0) fixe la taille d'affichage
    }

    /** Projette un point monde (x, y) en pixels écran (pour les textes flottants). */
    project(x, y) {
        const { w, h } = this.measure();
        this.tmp.set(x, y, 0).project(this.camera);
        return { x: (this.tmp.x * 0.5 + 0.5) * w, y: (-(this.tmp.y * 0.5) + 0.5) * h };
    }

    /** Baisse le pixel ratio si les frames restent lentes (appareils modestes). */
    adapt(frameDt) {
        const ms = frameDt * 1000;
        this.frameMsAvg += (ms - this.frameMsAvg) * 0.05;
        if (this.cooldown > 0) {
            this.cooldown -= frameDt;
            return;
        }
        this.slowFrames = this.frameMsAvg > 30 ? this.slowFrames + 1 : 0;
        if (this.slowFrames > 90 && this.pixelRatio > 0.75) {
            this.pixelRatio = Math.max(0.75, this.pixelRatio - 0.25);
            this.slowFrames = 0;
            this.cooldown = 2; // laisse la moyenne se stabiliser
            this.handleResize();
        }
    }

    render(frameDt) {
        const rig = this.rig;
        this.camera.position.set(rig.x, rig.y, rig.z);
        const look = rig.lookAt;
        this.camera.lookAt(look.x, look.y, look.z);

        // La lumière directionnelle suit la caméra pour garder des ombres nettes
        this.sun.position.x = rig.x + 15;
        this.sun.target.position.set(rig.x, 0, 0);
        this.sun.target.updateMatrixWorld();

        this.renderer.render(this.scene, this.camera);
        if (frameDt) this.adapt(frameDt);
    }

    dispose() {
        this.win.removeEventListener('resize', this.handleResize);
        this.win.removeEventListener('orientationchange', this.handleResize);
        if (this.resizeObserver) this.resizeObserver.disconnect();
        this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
        this.skyTexture.dispose();
        this.renderer.dispose();
    }
}
