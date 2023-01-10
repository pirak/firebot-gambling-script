// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2
import { GambleResult } from './gamble-result';

export interface GambleMode {
    winnings: (gamblingAmount: number, jackpotEnabled: boolean) => GambleResult;
}
