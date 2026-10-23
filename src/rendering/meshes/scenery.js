import { Group, Mesh } from 'three';

/** Collines souriantes (couche proche). */
export function createHillMesh(hill, bin) {
    const mat = bin.standard({ color: hill.color, roughness: 0.75 });
    const group = new Group();
    group.position.set(hill.x, hill.y, hill.z);

    const body = new Mesh(bin.cylinder(hill.radius, hill.radius * 1.15, hill.height, 16), mat);
    body.position.y = hill.height / 2;
    group.add(body);

    const dome = new Mesh(bin.sphere(hill.radius, 16, 12), mat);
    dome.position.y = hill.height;
    group.add(dome);

    // Petits yeux façon Super Mario World
    const eyeMat = bin.basic({ color: 0x0f172a });
    [-0.55, 0.55].forEach((ex) => {
        const eye = new Mesh(bin.cylinder(0.14, 0.14, 0.4, 8), eyeMat);
        eye.rotation.z = Math.PI / 2;
        eye.position.set(ex, hill.height + 0.2, hill.radius - 0.05);
        group.add(eye);
    });
    return group;
}

/** Nuage volumétrique composé de sphères blanches. */
export function createCloudMesh(cloud, bin) {
    const mat = bin.standard({ color: 0xffffff, roughness: 0.9 });
    const group = new Group();
    group.position.set(cloud.x, cloud.y, cloud.z);
    [
        { dx: 0, dy: 0.2, r: 1.25 },
        { dx: -1.1, dy: -0.1, r: 0.95 },
        { dx: 1.1, dy: -0.1, r: 0.95 },
        { dx: 0, dy: -0.25, r: 1.0 },
    ].forEach((p) => {
        const puff = new Mesh(bin.sphere(p.r, 12, 12), mat);
        puff.position.set(p.dx, p.dy, 0);
        group.add(puff);
    });
    return group;
}

/** Relief lointain (couche de parallaxe supplémentaire, teintes claires pour l'effet de brume). */
export function createFarHillMesh(hill, bin) {
    const mesh = new Mesh(bin.sphere(hill.radius, 14, 10), bin.basic({ color: hill.color, fog: true }));
    mesh.position.set(hill.x, hill.y, hill.z);
    mesh.scale.set(1.5, hill.squash, 0.35);
    return mesh;
}
