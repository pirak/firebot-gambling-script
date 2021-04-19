import { GambleResult } from './gamble-result';

export interface GambleMode {
    winnings: (gamblingAmount: number) => GambleResult;
}
