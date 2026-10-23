#!/usr/bin/env node
/**
 * Build de production (npm run build) avec esbuild : produit un dossier dist/ autonome
 * (index.html + 1 bundle JS contenant Three.js + 1 bundle CSS), déployable tel quel sur
 * n'importe quel hébergement statique (GitHub Pages, Render Static Site, Nginx, Pterodactyl…).
 *
 * Pourquoi esbuild et non Vite : même moteur de bundling, mais une seule dépendance de
 * développement et aucun fichier de configuration. Le jeu n'utilise aucune fonction propre à Vite.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });

const result = await build({
    absWorkingDir: root,
    entryPoints: {
        main: 'src/main.js',
        style: 'src/styles/main.css',
    },
    bundle: true,
    format: 'esm',
    target: ['es2020'],
    minify: true,
    sourcemap: false,
    outdir: 'dist/assets',
    entryNames: '[name]-[hash]',
    metafile: true,
    logLevel: 'warning',
});

const outputs = Object.keys(result.metafile.outputs);
const js = outputs.find((f) => f.endsWith('.js'));
const css = outputs.find((f) => f.endsWith('.css'));
if (!js || !css) throw new Error('Build incomplet : bundle JS ou CSS manquant.');

// index.html de production : retire l'importmap (three est dans le bundle) et pointe vers les bundles
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/\s*<!-- Three\.js r128[\s\S]*?<\/script>/, '');
html = html.replace('./src/styles/main.css', './' + path.relative('dist', css).replaceAll('\\', '/'));
html = html.replace('<script type="module" src="./src/main.js"></script>', `<script type="module" src="./${path.relative('dist', js).replaceAll('\\', '/')}"></script>`);
if (html.includes('importmap') || html.includes('./src/')) throw new Error('index.html de production invalide (références de développement restantes).');
fs.writeFileSync(path.join(dist, 'index.html'), html);

// Ressources publiques (public/ -> dist/)
const pub = path.join(root, 'public');
if (fs.existsSync(pub)) fs.cpSync(pub, dist, { recursive: true });

for (const f of outputs) {
    const kb = (fs.statSync(path.join(root, f)).size / 1024).toFixed(1);
    console.log(`  ${f}  ${kb} Ko`);
}
console.log('✔ Build terminé : dist/ (npm run preview pour le tester)');
