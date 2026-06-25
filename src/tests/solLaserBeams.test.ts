import {describe, expect, it} from 'vitest';
import {computeSolLaserBeams, SOL_ARENA_MAX_X} from '../lib/solLaserBeams';
import {GraphicsObjectState} from '../components/replay/GameState';

function tile(id: number, x: number, y: number, spawnTick: number): GraphicsObjectState {
    return {
        id,
        spawnTick,
        position: {x, y, plane: 0},
    };
}

describe('computeSolLaserBeams', () => {
    it('groups horizontal scan segments into one beam', () => {
        const graphics = {
            a: tile(2689, 1820, 3105, 10),
            b: tile(2689, 1821, 3105, 10),
            c: tile(2689, 1822, 3105, 10),
        };

        const beams = computeSolLaserBeams(graphics);
        expect(beams).toHaveLength(1);
        expect(beams[0]).toMatchObject({
            phase: 'scan',
            orientation: 'horizontal',
            fixedCoord: 3105,
            startVar: 1820,
            endVar: 1822,
            textureId: 2689,
        });
    });

    it('extends beam from west-edge prism to arena bounds', () => {
        const graphics = {
            prism: tile(2691, 1818, 3105, 20),
            seg: tile(2689, 1820, 3105, 20),
        };

        const beams = computeSolLaserBeams(graphics);
        expect(beams).toHaveLength(1);
        expect(beams[0]).toMatchObject({
            orientation: 'horizontal',
            fixedCoord: 3105,
            startVar: 1819,
            endVar: SOL_ARENA_MAX_X,
        });
    });

    it('groups vertical shot segments separately from scan', () => {
        const graphics = {
            scan: tile(2690, 1825, 3101, 30),
            scan2: tile(2690, 1825, 3102, 30),
            shot: tile(2694, 1825, 3108, 40),
            shot2: tile(2694, 1825, 3109, 40),
        };

        const beams = computeSolLaserBeams(graphics);
        expect(beams).toHaveLength(2);
        expect(beams.find((beam) => beam.spawnTick === 30)).toMatchObject({
            phase: 'scan',
            orientation: 'vertical',
            textureId: 2690,
        });
        expect(beams.find((beam) => beam.spawnTick === 40)).toMatchObject({
            phase: 'shot',
            orientation: 'vertical',
            textureId: 2694,
        });
    });
});
