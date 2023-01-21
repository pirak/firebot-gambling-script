// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2
import { Range } from '../gamble-effect';
import { NumRange } from './util/range';

/**
 * Describes a number range in which the player wins their gambled points amount
 * multiplied by a multiplier or wins the jackpot.
 */
export class WinRange {
    readonly range: NumRange;
    readonly jackpot: boolean;
    readonly multiplier?: number;

    private constructor(range: NumRange, jackpot: boolean, multiplier?: number) {
        this.range = range;
        this.jackpot = jackpot;
        this.multiplier = multiplier;
    }

    public static fromRange(range: Range): WinRange {
        const numRange = new NumRange(range.from, range.to);
        if (range.rangeType === 'Jackpot') {
            return WinRange.jackpot(numRange);
        } else {
            return WinRange.regular(numRange, range.mult ?? 0);
        }
    }

    public static jackpot(range: NumRange): WinRange {
        return new WinRange(range, true);
    }

    public static regular(range: NumRange, multiplier: number): WinRange {
        return new WinRange(range, false, multiplier);
    }

    public overlaps(other: WinRange): boolean {
        return this.range.overlaps(other.range);
    }

    /**
     * Checks if any two given ranges overlap.
     * @param ranges The ranges that should be checked.
     */
    public static anyRangeOverlap(ranges: Array<WinRange>): boolean {
        for (let i = 0; i < ranges.length; ++i) {
            for (let j = i + 1; j < ranges.length; ++j) {
                if (ranges[i].overlaps(ranges[j])) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Checks if the combination of all ranges covers the full range without gaps.
     * @param ranges A list of ranges which should cover some overall range.
     * @param fullRange The overall range that should be covered.
     */
    public static coverFullRange(ranges: Array<WinRange>, fullRange: NumRange): boolean {
        // the fullRange is inclusive and contains at least one element,
        // therefore it can’t be covered if no other ranges are given
        if (ranges.length === 0) {
            return false;
        }

        const sortedRanges = [...ranges]
            .sort((a, b) => a.range.compareTo(b.range))
            .reduce((acc: WinRange[], next: WinRange) => {
                // only keep the ranges that are not fully included in other ones
                if (acc.length === 0) {
                    return [next];
                } else if (acc[acc.length - 1].range.includes(next.range)) {
                    return acc;
                } else {
                    acc.push(next);
                    return acc;
                }
            }, []);
        const min = sortedRanges[0].range.from;
        const max = sortedRanges[sortedRanges.length - 1].range.to;

        let hasGaps = false;
        for (let i = 0; i < sortedRanges.length - 1 && !hasGaps; ++i) {
            const curr = sortedRanges[i].range;
            const next = sortedRanges[i + 1].range;

            const gapToNext = curr.to < next.from - 1;
            hasGaps = hasGaps || gapToNext;
        }

        return min <= fullRange.from && max >= fullRange.to && !hasGaps;
    }
}
