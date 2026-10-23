import { Group, Mesh } from 'three';

/** Pièce d'or octogonale avec gravure centrale. */
export function createCoinMesh(coin, bin) {
    const group = new Group();
    group.position.set(coin.x, coin.y, 0);

    const goldMat = bin.standard({
        color: 0xfacc15,
        emissive: 0xca8a04,
        emissiveIntensity: 0.25,
        roughness: 0.2,
        metalness: 0.85,
    });
    const disk = new Mesh(bin.cylinder(0.42, 0.42, 0.14, 12), goldMat);
    disk.rotation.x = Math.PI / 2;
    disk.castShadow = true;
    group.add(disk);

    const slotMat = bin.standard({ color: 0xa16207, roughness: 0.4 });
    group.add(new Mesh(bin.box(0.11, 0.42, 0.16), slotMat));

    return group;
}
