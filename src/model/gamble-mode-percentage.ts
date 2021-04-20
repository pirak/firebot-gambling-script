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
     * @param jackpotEnabled unused.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    winnings(gamblingAmount: number, jackpotEnabled: boolean = true): GambleResult {
        const roll = GambleModePercentage.randIntInclusive(this.maxRoll);

        if (roll === this.neutralValue) {
            return new GambleResult(GambleResultType.Neutral, this.neutralValue);
        } else if (roll === 100) {
            return new GambleResult(GambleResultType.Jackpot, this.maxRoll);
        } else if (roll === 0) {
            return new GambleResult(GambleResultType.Lost, 0, gamblingAmount);
        }

        const resultType = roll > 50 ? GambleResultType.Won : GambleResultType.Lost;
        const resultAmount = Math.abs(this.neutralValue - roll) * 0.02 * gamblingAmount;

        return new GambleResult(resultType, roll, Math.floor(resultAmount));
    }

    /**
     * Generates a random integer in range [0, max] inclusive.
     * @param max upper bound inclusive.
     * @returns a random integer in range [0, max] inclusive.
     * @private
     */
    private static randIntInclusive(max: number): number {
        // Node crypto module for proper randomness is not available in Firebot
        return Math.floor(Math.random() * (max + 1));
    }
}
