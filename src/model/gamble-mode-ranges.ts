import { GambleMode } from './gamble-mode';
import { GambleResult, GambleResultType } from './gamble-result';
import { NumRange } from './util/range';
import { WinRange } from './win-range';
import { Rand } from '../helpers/rand';

export enum RangeError {
    Empty,
    Negative,
    NonContiguous,
    Overlap,
}

/**
 * ToDo: explain game mode
 */
export class GambleModeRanges implements GambleMode {
    private readonly winRanges: Array<WinRange>;
    private readonly min: number;
    private readonly max: number;

    /**
     * Constructs the object for a non-empty win ranges list.
     * @param winRanges The list of ranges and their winnings multipliers.
     * @private
     */
    private constructor(winRanges: Array<WinRange>) {
        this.winRanges = winRanges;
        this.min = winRanges[0].range.from;
        this.max = winRanges[winRanges.length - 1].range.to;
    }

    /**
     * Tries to build a game setting from the given win ranges.
     *
     * Required conditions on {@code winRanges}:
     * - Has at least one element.
     * - The ranges are not allowed to overlap.
     * - There must be no gaps between the ranges.
     * - The minimal range start must be at least zero.
     *
     * @param winRanges The list of ranges and their winnings multipliers.
     * @return A game setting if all required conditions are met.
     */
    public static build(winRanges: Array<WinRange>): GambleModeRanges | RangeError {
        if (winRanges.length == 0) {
            return RangeError.Empty;
        }

        const ranges = [...winRanges].sort((a, b) => a.range.compareTo(b.range));
        const min = ranges[0].range.from;
        const max = ranges[ranges.length - 1].range.to;

        if (WinRange.anyRangeOverlap(ranges)) {
            return RangeError.Overlap;
        } else if (!WinRange.coverFullRange(ranges, new NumRange(min, max))) {
            return RangeError.NonContiguous;
        } else if (min < 0) {
            return RangeError.Negative;
        } else {
            return new GambleModeRanges(winRanges);
        }
    }

    /**
     * @inheritDoc
     */
    winnings(gamblingAmount: number, jackpotEnabled: boolean): GambleResult {
        const roll = Rand.randIntInclusive(this.min, this.max);
        const result = this.matchingRange(roll);

        if (result.jackpot) {
            return this.getWinningsJackpot(jackpotEnabled, roll);
        } else {
            return this.getWinningsRegular(result, gamblingAmount, roll);
        }
    }

    private getWinningsJackpot(jackpotEnabled: boolean, roll: number) {
        if (jackpotEnabled) {
            return new GambleResult(GambleResultType.Jackpot, roll);
        } else {
            return new GambleResult(GambleResultType.Neutral, roll);
        }
    }

    private getWinningsRegular(result: WinRange, gamblingAmount: number, roll: number) {
        let resultType: GambleResultType;
        if (result.multiplier! === 0) {
            resultType = GambleResultType.Neutral;
        } else if (result.multiplier! > 0) {
            resultType = GambleResultType.Won;
        } else {
            resultType = GambleResultType.Lost;
        }

        const winnings = Math.abs(result.multiplier! * gamblingAmount);

        return new GambleResult(resultType, roll, winnings);
    }

    private matchingRange(roll: number): WinRange {
        return this.winRanges.find((winRange) => winRange.range.contains(roll))!;
    }
}
