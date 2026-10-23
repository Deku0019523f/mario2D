import { Group, Mesh, InstancedMesh, Object3D } from 'three';

/**
 * Plateforme d'herbe sculptée : corps de terre, couche d'herbe débordante, touffes festonnées
 * en façade (instanciées : 1 seul appel de rendu) et buissons décoratifs.
 * @param {{x:number,width:number,yTop:number,height:number,bushes:number[]}} pl
 * @param {import('../ResourceBin.js').ResourceBin} bin
 */
export function createPlatformMesh(pl, bin) {
    const { x, width, yTop, height } = pl;
    const group = new Group();
    group.position.set(x + width / 2, yTop - height / 2, 0);

    const soilMat = bin.standard({ color: 0x92400e, roughness: 0.88 });
    const grassMat = bin.standard({ color: 0x22c55e, roughness: 0.55 });

    // Corps en terre
    const soil = new Mesh(bin.box(width, height - 0.35, 3.2), soilMat);
    soil.position.y = -0.175;
    soil.receiveShadow = true;
    soil.castShadow = true;
    group.add(soil);

    // Couche d'herbe
    const grassTop = new Mesh(bin.box(width + 0.25, 0.45, 3.5), grassMat);
    grassTop.position.y = height / 2 - 0.22;
    grassTop.receiveShadow = true;
    grassTop.castShadow = true;
    group.add(grassTop);

    // Touffes festonnées en façade (la version d'origine contenait ici la faute « constnumTufts »)
    const numTufts = Math.floor(width / 1.4);
    if (numTufts > 0) {
        const tufts = new InstancedMesh(bin.sphere(0.32, 8, 8), grassMat, numTufts);
        const dummy = new Object3D();
        for (let i = 0; i < numTufts; i++) {
            dummy.position.set(-width / 2 + 0.7 + i * 1.4, height / 2 - 0.42, 1.65);
            dummy.scale.set(1.3, 0.65, 0.5);
            dummy.updateMatrix();
            tufts.setMatrixAt(i, dummy.matrix);
        }
        tufts.instanceMatrix.needsUpdate = true;
        group.add(tufts);
    }

    // Buissons à l'arrière du chemin
    const bushMat = bin.standard({ color: 0x16a34a, roughness: 0.6 });
    for (const bx of pl.bushes) {
        const bush = new Group();
        bush.position.set(bx, height / 2, -1.15);
        [-0.45, 0, 0.45].forEach((dx, idx) => {
            const r = idx === 1 ? 0.55 : 0.4;
            const sphere = new Mesh(bin.sphere(r, 10, 10), bushMat);
            sphere.position.set(dx, r * 0.7, 0);
            sphere.castShadow = true;
            bush.add(sphere);
        });
        group.add(bush);
    }

    return group;
}
