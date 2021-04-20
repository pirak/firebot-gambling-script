import { GambleResult } from './gamble-result';

export interface GambleMode {
    winnings: (gamblingAmount: number, jackpotEnabled: boolean) => GambleResult;
}
