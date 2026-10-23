#!/usr/bin/env node
/**
 * Vérifications statiques du projet (npm run check) — sans dépendance :
 *   1. syntaxe de chaque fichier .js/.mjs (node --check) ;
 *   2. aucun fichier source vide ;
 *   3. tous les imports relatifs pointent vers un fichier existant ;
 *   4. aucune dépendance circulaire entre modules de src/ ;
 *   5. tous les identifiants HTML requis par src/ui/Dom.js existent dans index.html.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', 'dist', '.git', 'legacy']);

function walk(dir, out = []) {
    for (const name of fs.readdirSync(dir)) {
        if (SKIP.has(name)) continue;
        const full = path.join(dir, name);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) walk(full, out);
        else out.push(full);
    }
    return out;
}

const errors = [];
const rel = (f) => path.relative(root, f).replaceAll('\\', '/');
const files = walk(root);
const jsFiles = files.filter((f) => /\.(m?js)$/.test(f));

// 1 + 2. Syntaxe et fichiers vides
for (const f of jsFiles) {
    if (fs.statSync(f).size === 0) errors.push(`Fichier vide : ${rel(f)}`);
    const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    if (r.status !== 0) errors.push(`Erreur de syntaxe dans ${rel(f)} :\n${r.stderr.trim()}`);
}
for (const f of files.filter((f) => /\.(css|html|md|json)$/.test(f))) {
    if (fs.statSync(f).size === 0) errors.push(`Fichier vide : ${rel(f)}`);
}

// 3. Imports relatifs
const IMPORT_RE = /(?:^|\n)\s*(?:import|export)\s+(?:[^'"\n;]*?\s+from\s+)?['"]([^'"]+)['"]/g;
const graph = new Map();
for (const f of jsFiles) {
    const src = fs.readFileSync(f, 'utf8');
    const deps = [];
    for (const m of src.matchAll(IMPORT_RE)) {
        const spec = m[1];
        if (!spec.startsWith('.')) continue; // paquet npm (three…)
        const target = path.resolve(path.dirname(f), spec);
        if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
            errors.push(`Import introuvable dans ${rel(f)} : '${spec}'`);
        } else {
            deps.push(target);
        }
    }
    graph.set(f, deps);
}

// 4. Cycles (src/ uniquement)
const state = new Map();
const stack = [];
function dfs(node) {
    state.set(node, 1);
    stack.push(node);
    for (const dep of graph.get(node) || []) {
        if (!dep.startsWith(path.join(root, 'src'))) continue;
        if (state.get(dep) === 1) {
            const cycle = [...stack.slice(stack.indexOf(dep)), dep].map(rel).join(' -> ');
            errors.push(`Dépendance circulaire : ${cycle}`);
        } else if (!state.has(dep)) {
            dfs(dep);
        }
    }
    stack.pop();
    state.set(node, 2);
}
for (const f of graph.keys()) if (f.startsWith(path.join(root, 'src')) && !state.has(f)) dfs(f);

// 5. IDs HTML requis
const domModule = await import(pathToFileURL(path.join(root, 'src/ui/Dom.js')).href);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const id of Object.values(domModule.REQUIRED_IDS)) {
    if (!new RegExp(`id=["']${id}["']`).test(html)) errors.push(`index.html : id="${id}" manquant (requis par src/ui/Dom.js)`);
}

// Modules orphelins (information)
const used = new Set([...graph.values()].flat());
const orphans = [...graph.keys()].filter(
    (f) => f.startsWith(path.join(root, 'src')) && !used.has(f) && rel(f) !== 'src/main.js',
);

if (errors.length) {
    console.error(`✘ ${errors.length} problème(s) détecté(s) :\n`);
    errors.forEach((e) => console.error(' - ' + e));
    process.exit(1);
}
console.log(`✔ ${jsFiles.length} fichiers JS : syntaxe OK, imports résolus, aucun cycle, IDs HTML cohérents.`);
if (orphans.length) console.log(`ℹ Modules non importés : ${orphans.map(rel).join(', ')}`);
