import { CanvasTexture, LinearFilter, LinearMipMapLinearFilter } from 'three';

/**
 * Polyfill de CanvasRenderingContext2D.roundRect (absent des WebView Android anciens,
 * Safari < 16, Firefox < 112) : sans lui les sprites ne se dessineraient pas du tout.
 */
export function installRoundRectPolyfill(ctxProto = globalThis.CanvasRenderingContext2D && globalThis.CanvasRenderingContext2D.prototype) {
    if (!ctxProto || typeof ctxProto.roundRect === 'function') return;
    ctxProto.roundRect = function roundRect(x, y, w, h, radius = 0) {
        let r = Array.isArray(radius) ? radius[0] || 0 : radius;
        r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
    };
}

/**
 * Ajoute un contour blanc découpé façon « sticker » Paper Mario autour de la silhouette d'un sprite.
 * @param {HTMLCanvasElement} canvas sprite source (fond transparent)
 * @param {number} radius épaisseur du contour en pixels du canvas
 * @param {Document} doc
 */
export function addPaperOutline(canvas, radius, doc) {
    const out = doc.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    const o = out.getContext('2d');
    const steps = 16;
    for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        o.drawImage(canvas, Math.cos(a) * radius, Math.sin(a) * radius);
    }
    o.globalCompositeOperation = 'source-in';
    o.fillStyle = '#ffffff';
    o.fillRect(0, 0, out.width, out.height);
    o.globalCompositeOperation = 'source-over';
    o.drawImage(canvas, 0, 0);
    return out;
}

/**
 * Dessine un sprite sur un canvas puis en fait une texture Three.js.
 *
 * @param {(ctx: CanvasRenderingContext2D, w: number, h: number) => void} drawFn dessin en coordonnées logiques `size` × `size`
 * @param {object} [opts]
 * @param {number} [opts.size] taille logique (128, comme l'original)
 * @param {number} [opts.resolution] facteur de résolution réelle (2 = sprites 2× plus nets que l'original)
 * @param {number} [opts.outline] épaisseur du contour papier en pixels logiques (0 = aucun)
 * @param {Document} [opts.doc]
 */
export function makeCanvasTexture(drawFn, { size = 128, resolution = 2, outline = 0, doc = document } = {}) {
    const px = size * resolution;
    const canvas = doc.createElement('canvas');
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext('2d');
    ctx.scale(resolution, resolution);
    drawFn(ctx, size, size);

    const source = outline > 0 ? addPaperOutline(canvas, outline * resolution, doc) : canvas;
    const tex = new CanvasTexture(source);
    tex.magFilter = LinearFilter;
    tex.minFilter = LinearMipMapLinearFilter;
    tex.anisotropy = 4; // plafonné automatiquement par les capacités du GPU
    tex.needsUpdate = true;
    return tex;
}
