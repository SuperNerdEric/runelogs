import {describe, expect, it} from 'vitest';
import {formatObjectPopup} from '../components/replay/MapMarkers';

describe('formatObjectPopup', () => {
    it('labels ground objects distinctly from graphics and game objects', () => {
        expect(formatObjectPopup('Ground object', 32743, 'Xarpus exhume')).toBe(
            'Ground object: 32743 (Xarpus exhume)',
        );
        expect(formatObjectPopup('Graphics', 3998)).toBe('Graphics: 3998');
        expect(formatObjectPopup('Game object', 57283, 'Doom venom splat')).toBe(
            'Game object: 57283 (Doom venom splat)',
        );
    });
});
