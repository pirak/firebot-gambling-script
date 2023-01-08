import { Rand } from '../helpers/rand';
import { GambleMode } from './gamble-mode';
import { GambleResult, GambleResultType } from './gamble-result';

export class GambleModePercentage implements GambleMode {
    private readonly maxRoll: number = 100;
    private readonly neutralValue: number = 50;

    /**
     * Rolls a D100 die and calculates a result amount on a linear scale in range [-gamblingAmount, gamblingAmount].
     *
     * Special cases:
     * - Roll 100: Jackpot
     * - Roll 50:  Neutral
     * - Roll 0:   `gamblingAmount` is lost.
     *
     * @param gamblingAmount the amount the user entered into the bet.
     * @param jackpotEnabled if disabled, the user wins gamblingAmount instead.
     */
    winnings(gamblingAmount: number, jackpotEnabled: boolean = true): GambleResult {
        const roll = Rand.randIntInclusive(this.maxRoll);

        if (roll === this.neutralValue) {
            return new GambleResult(GambleResultType.Neutral, this.neutralValue);
        } else if (roll === 100 && jackpotEnabled) {
            return new GambleResult(GambleResultType.Jackpot, this.maxRoll);
        } else if (roll === 0) {
            return new GambleResult(GambleResultType.Lost, 0, gamblingAmount);
        }

        const resultType = roll > 50 ? GambleResultType.Won : GambleResultType.Lost;
        const resultAmount = Math.abs(this.neutralValue - roll) * 0.02 * gamblingAmount;

        return new GambleResult(resultType, roll, Math.floor(resultAmount));
    }
}
