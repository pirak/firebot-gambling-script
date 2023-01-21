// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2
import { GambleResult } from './gamble-result';

export interface GambleMode {
    /**
     * Calculates the result according to the game settings.
     * @param gamblingAmount The amount of points the user wagered.
     * @param jackpotEnabled True, if a jackpot win should be possible. Not all
     *                       game modes might have a jackpot feature.
     */
    winnings: (gamblingAmount: number, jackpotEnabled: boolean) => GambleResult;
}
