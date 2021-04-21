import { GambleMode } from './gamble-mode';
import { GambleResult, GambleResultType } from './gamble-result';
import { Rand } from '../helpers/rand';

export class GambleModeThreshold implements GambleMode {
    private readonly maxRoll: number;
    private readonly threshold: number;
    private readonly jackpotTarget: number;
    private readonly winPointsFactor: number;

    constructor(maxRoll: number, threshold: number, jackpotTarget: number, winPointsFactor: number) {
        this.maxRoll = maxRoll;
        this.threshold = threshold;
        this.jackpotTarget = jackpotTarget;
        this.winPointsFactor = winPointsFactor;
    }

    /**
     * Generates a random number in range [0, this.maxRoll] and creates a result based on that.
     *
     * Possible Cases for `roll`:
     * - `roll == threshold`: neutral result
     * - `roll < threshold`: lose all entered points
     * - `roll > threshold`: win the entered points multiplied by the `winPointsFactor`
     * - `roll == jackpotTarget`:
     *   - if jackpot enabled: win the jackpot
     *   - if jackpot disabled: treat the roll as a regular win/loss/neutral as above
     *
     * @param gamblingAmount the amount the user entered into the bet.
     * @param jackpotEnabled changes the behaviour as described above.
     */
    winnings(gamblingAmount: number, jackpotEnabled: boolean): GambleResult {
        const roll = Rand.randIntInclusive(this.maxRoll);

        if (roll === this.jackpotTarget && jackpotEnabled) {
            return new GambleResult(GambleResultType.Jackpot, roll);
        }

        if (roll === this.threshold) {
            return new GambleResult(GambleResultType.Neutral, roll);
        } else if (roll > this.threshold) {
            return new GambleResult(GambleResultType.Won, roll, gamblingAmount * this.winPointsFactor);
        } else {
            return new GambleResult(GambleResultType.Lost, roll, gamblingAmount);
        }
    }
}
