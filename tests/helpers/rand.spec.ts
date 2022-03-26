// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2
import { Rand } from '../../src/helpers/rand';
import { resetRndRandIntInclusive } from '../helpers';

describe('The random number generator', () => {
    beforeAll(() => {
        resetRndRandIntInclusive();
    });

    it('should be in range inclusive for a minimum of 0', () => {
        genRepeat(0, 100);
    });

    it('should be in range inclusive for a minimum != 0', () => {
        genRepeat(5, 100);
    });

    function genRepeat(min: number, max: number, iterations: number = 10_000) {
        let minFound = false;
        let maxFound = false;

        for (let i = 0; i < iterations; ++i) {
            const n = Rand.randIntInclusive(min, max);
            expect(n).toBeGreaterThanOrEqual(min);
            expect(n).toBeLessThanOrEqual(max);
            expect(n).toEqual(Math.floor(n));

            if (n === min) {
                minFound = true;
            }
            if (n === max) {
                maxFound = true;
            }
        }

        expect(minFound).toBe(true);
        expect(maxFound).toBe(true);
    }
});
