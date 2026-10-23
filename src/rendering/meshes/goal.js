import { Group, Mesh, MeshStandardMaterial } from 'three';
import { POLE_HEIGHT } from '../../world/Goal.js';

/**
 * Mât du drapeau d'arrivée + château en briques.
 * @returns {{group: Group, banner: Group}} `banner` : fanion dont l'ordonnée suit `flag.bannerY`
 */
export function createGoalMesh(flag, textures, bin) {
    const group = new Group();
    group.position.set(flag.x, 0, 0);

    // Socle
    const base = new Mesh(bin.cylinder(0.65, 0.8, 0.9, 12), bin.standard({ color: 0xd97706, roughness: 0.5 }));
    base.position.y = 0.45;
    base.castShadow = true;
    group.add(base);

    // Mât argenté
    const pole = new Mesh(
        bin.cylinder(0.11, 0.11, POLE_HEIGHT, 12),
        bin.standard({ color: 0xf8fafc, metalness: 0.6, roughness: 0.2 }),
    );
    pole.position.y = POLE_HEIGHT / 2 + 0.45;
    pole.castShadow = true;
    group.add(pole);

    // Boule dorée
    const ball = new Mesh(bin.sphere(0.38, 16, 16), bin.standard({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 }));
    ball.position.y = POLE_HEIGHT + 0.55;
    group.add(ball);

    // Fanion rouge coulissant
    const banner = new Group();
    banner.position.set(0, flag.bannerY, 0);
    const bannerMesh = new Mesh(bin.cone(0.85, 1.9, 3), bin.standard({ color: 0xef4444, roughness: 0.4 }));
    bannerMesh.rotation.z = Math.PI / 2;
    bannerMesh.position.x = -0.95;
    banner.add(bannerMesh);
    group.add(banner);

    // Château du Royaume Champignon
    const castle = new Group();
    castle.position.set(5.2, 0, -1.2);
    // Matériau propre au château (texture de briques partagée, libérée avec le niveau)
    const brickMat = bin.track(new MeshStandardMaterial({ map: textures.brick, roughness: 0.7 }));
    const roofMat = bin.standard({ color: 0xdc2626, roughness: 0.5 });

    const keep = new Mesh(bin.box(4.4, 3.6, 3.6), brickMat);
    keep.position.y = 1.8;
    keep.castShadow = true;
    keep.receiveShadow = true;
    castle.add(keep);

    const tower = new Mesh(bin.cylinder(1.4, 1.5, 2.2, 12), brickMat);
    tower.position.y = 4.4;
    castle.add(tower);

    const roof = new Mesh(bin.cone(1.85, 1.8, 12), roofMat);
    roof.position.y = 6.3;
    castle.add(roof);

    const door = new Mesh(bin.cylinder(0.75, 0.75, 1.8, 12), bin.basic({ color: 0x090d16 }));
    door.rotation.x = Math.PI / 2;
    door.position.set(0, 0.9, 1.75);
    castle.add(door);

    group.add(castle);
    return { group, banner };
}
