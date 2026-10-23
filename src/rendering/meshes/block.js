import { Group, Mesh, MeshStandardMaterial } from 'three';

/**
 * Bloc "?" ou brique : cœur texturé + anneaux supérieur/inférieur en relief.
 * Le matériau du cœur est propre à chaque bloc (la texture change quand il est utilisé).
 * @returns {{group: Group, core: Mesh}}
 */
export function createBlockMesh(block, textures, bin) {
    const size = block.size;
    const isQuestion = block.blockType === 'question';

    const group = new Group();
    group.position.set(block.x, block.baseY, 0);

    const coreMat = bin.track(
        new MeshStandardMaterial({
            map: isQuestion ? textures.qBlockActive : textures.brick,
            roughness: 0.4,
            metalness: isQuestion ? 0.2 : 0.05,
        }),
    );
    const core = new Mesh(bin.box(size, size, size), coreMat);
    core.castShadow = true;
    core.receiveShadow = true;
    group.add(core);

    const rimMat = bin.standard({ color: isQuestion ? 0xb45309 : 0x451a03, roughness: 0.5 });
    const rimGeo = bin.box(size * 1.04, 0.07, size * 1.04);

    const topRim = new Mesh(rimGeo, rimMat);
    topRim.position.y = size / 2;
    group.add(topRim);

    const bottomRim = new Mesh(rimGeo, rimMat);
    bottomRim.position.y = -size / 2;
    group.add(bottomRim);

    return { group, core };
}
