import { Rand } from '../../src/helpers/rand';
import { resetRndRandIntInclusive } from '../helpers';

describe('The random number generator', () => {
    resetRndRandIntInclusive();

    it('should be in range inclusive and only be integers', async () => {
        let minFound = false;
        let maxFound = false;

        for (let i = 0; i < 10000; ++i) {
            const n = Rand.randIntInclusive(100);
            expect(n).toBeGreaterThanOrEqual(0);
            expect(n).toBeLessThanOrEqual(100);
            expect(n).toEqual(Math.floor(n));

            if (n === 0) {
                minFound = true;
            }
            if (n === 100) {
                maxFound = true;
            }
        }

        expect(minFound).toBe(true);
        expect(maxFound).toBe(true);
    });
});
