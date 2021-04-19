import { resetRngGambleModePercentage } from '../helpers';
import { GambleModePercentage } from '../../src/model/gamble-mode-percentage';

describe('The random number generator', () => {
    resetRngGambleModePercentage();

    // @ts-ignore
    const rng = (max: number) => GambleModePercentage.randIntInclusive(max);

    it('should be in range inclusive and only be integers', async () => {
        let minFound = false;
        let maxFound = false;

        for (let i = 0; i < 10000; ++i) {
            const n = rng(100);
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
