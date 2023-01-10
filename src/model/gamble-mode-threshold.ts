// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2
import { Rand } from '../helpers/rand';
import { GambleMode } from './gamble-mode';
import { GambleResult, GambleResultType } from './gamble-result';

export interface GambleModeThresholdParams {
    maxRoll: number;
    threshold: number;
    jackpotTarget: number;
    winPointsFactor: number;
}

export class GambleModeThreshold implements GambleMode {
    private readonly maxRoll: number;
    private readonly threshold: number;
    private readonly jackpotTarget: number;
    private readonly winPointsFactor: number;

    constructor(params: GambleModeThresholdParams) {
        this.maxRoll = params.maxRoll;
        this.threshold = params.threshold;
        this.jackpotTarget = params.jackpotTarget;
        this.winPointsFactor = params.winPointsFactor;
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
