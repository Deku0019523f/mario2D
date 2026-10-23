#!/usr/bin/env node
/**
 * Serveur statique minimal SANS dépendance (npm run dev / npm run preview).
 * Sert le dossier du projet (ou `--dir dist`), avec les bons types MIME pour les modules ES.
 *
 *   node scripts/serve.mjs [--dir <dossier>] [--port 5173] [--host 0.0.0.0]
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import os from 'node:os';

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.map': 'application/json',
};

/**
 * Démarre le serveur.
 * @returns {Promise<{server: http.Server, port: number, close: () => Promise<void>}>}
 */
export function startServer({ root, port = 5173, host = '0.0.0.0' }) {
    const base = path.resolve(root);
    // Les modules sont toujours cherchés dans le projet, même quand on sert dist/
    const server = http.createServer((req, res) => {
        try {
            const url = new URL(req.url, 'http://localhost');
            let rel = decodeURIComponent(url.pathname);
            if (rel.endsWith('/')) rel += 'index.html';
            const file = path.resolve(base, '.' + rel);
            if (file !== base && !file.startsWith(base + path.sep)) {
                res.writeHead(403).end('Interdit');
                return;
            }
            fs.stat(file, (err, stat) => {
                if (err || !stat.isFile()) {
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Introuvable : ' + rel);
                    return;
                }
                res.writeHead(200, {
                    'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
                    'Cache-Control': 'no-cache',
                });
                fs.createReadStream(file).pipe(res);
            });
        } catch {
            res.writeHead(400).end('Requête invalide');
        }
    });

    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
            const actual = server.address().port;
            resolve({
                server,
                port: actual,
                close: () => new Promise((r) => server.close(() => r())),
            });
        });
    });
}

function lanAddresses() {
    return Object.values(os.networkInterfaces())
        .flat()
        .filter((i) => i && i.family === 'IPv4' && !i.internal)
        .map((i) => i.address);
}

// Exécution en ligne de commande
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
    const args = process.argv.slice(2);
    const opt = (name, fallback) => {
        const i = args.indexOf(`--${name}`);
        return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
    };
    const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const root = path.resolve(projectRoot, opt('dir', '.'));
    const port = Number(opt('port', process.env.PORT || 5173));
    const host = opt('host', '0.0.0.0');

    if (!fs.existsSync(path.join(root, 'index.html'))) {
        console.error(`index.html introuvable dans ${root}` + (root.endsWith('dist') ? ' — lancez d\'abord « npm run build ».' : ''));
        process.exit(1);
    }
    if (!fs.existsSync(path.join(root, 'node_modules', 'three')) && !root.endsWith('dist')) {
        console.warn('⚠ node_modules/three est absent : lancez « npm install » avant de démarrer.');
    }

    startServer({ root, port, host })
        .then(({ port: p }) => {
            console.log(`\n🍄 Super Mario 2.5D — serveur démarré (${root})`);
            console.log(`   PC      : http://localhost:${p}/`);
            for (const ip of lanAddresses()) console.log(`   Android : http://${ip}:${p}/   (même réseau Wi-Fi)`);
            console.log('   Ctrl+C pour arrêter.\n');
        })
        .catch((e) => {
            console.error(e.code === 'EADDRINUSE' ? `Le port ${port} est déjà utilisé (essayez --port 5174).` : e);
            process.exit(1);
        });
}
