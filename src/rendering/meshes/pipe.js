import { Group, Mesh } from 'three';

/** Tuyau vert cylindrique avec collerette et intérieur sombre. */
export function createPipeMesh(pipe, bin) {
    const { x, y, height, radius } = pipe;
    const group = new Group();
    group.position.set(x, y, 0);

    const pipeMat = bin.standard({ color: 0x16a34a, roughness: 0.28, metalness: 0.18 });
    const darkInsideMat = bin.basic({ color: 0x052e16 });

    const lipHeight = 0.34;
    const bodyH = Math.max(0.4, height - lipHeight);

    const body = new Mesh(bin.cylinder(radius, radius, bodyH, 20), pipeMat);
    body.position.y = bodyH / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const lip = new Mesh(bin.cylinder(radius * 1.14, radius * 1.14, lipHeight, 20), pipeMat);
    lip.position.y = height - lipHeight / 2;
    lip.castShadow = true;
    lip.receiveShadow = true;
    group.add(lip);

    const hole = new Mesh(bin.cylinder(radius * 0.88, radius * 0.88, 0.06, 16), darkInsideMat);
    hole.position.y = height + 0.01;
    group.add(hole);

    return group;
}
