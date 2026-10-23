#!/usr/bin/env node
/**
 * Lance tous les tests unitaires et d'intégration (*.test.js sous tests/) avec le lanceur
 * natif de Node (node:test) : aucune dépendance de test à installer.
 * Les tests de bout en bout (navigateur) se lancent à part : npm run test:e2e.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function collect(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) collect(full, out);
        else if (name.endsWith('.test.js')) out.push(full);
    }
    return out;
}

const files = [...collect(path.join(root, 'tests/unit')), ...collect(path.join(root, 'tests/integration'))].sort();
if (files.length === 0) {
    console.error('Aucun test trouvé.');
    process.exit(1);
}

const r = spawnSync(process.execPath, ['--test', ...files], { cwd: root, stdio: 'inherit' });
process.exit(r.status ?? 1);
