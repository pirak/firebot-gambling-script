// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2
import { GambleModeRanges, RangeError } from '../../src/model/gamble-mode-ranges';
import { GambleResult, GambleResultType } from '../../src/model/gamble-result';
import { NumRange } from '../../src/model/util/range';
import { WinRange } from '../../src/model/win-range';
import { mockExpectedRoll } from '../helpers';

describe('The Gambling Mode Ranges', () => {
    const defaultRanges = [
        WinRange.regular(new NumRange(0, 49), -1),
        WinRange.regular(new NumRange(50, 50), 0),
        WinRange.regular(new NumRange(51, 99), 3),
        WinRange.jackpot(new NumRange(100, 100)),
    ];
    const gamblingMode = <GambleModeRanges>GambleModeRanges.build(defaultRanges);

    describe('constructor checks', () => {
        it('should not allow no ranges', () => {
            const mode = GambleModeRanges.build([]);
            expect(mode).toBe(RangeError.Empty);
        });

        it('should not allow ranges having negative values', () => {
            const ranges = [WinRange.jackpot(new NumRange(20, 100)), WinRange.regular(new NumRange(-3, 19), 1)];
            const mode = GambleModeRanges.build(ranges);
            expect(mode).toBe(RangeError.Negative);
        });

        it('should not allow ranges that are non contiguous', () => {
            const ranges = [WinRange.jackpot(new NumRange(20, 100)), WinRange.regular(new NumRange(2, 15), 1)];
            const mode = GambleModeRanges.build(ranges);
            expect(mode).toBe(RangeError.NonContiguous);
        });

        it('should not allow ranges with overlapping elements', () => {
            const ranges = [WinRange.jackpot(new NumRange(20, 100)), WinRange.regular(new NumRange(0, 25), 1)];
            const mode = GambleModeRanges.build(ranges);
            expect(mode).toBe(RangeError.Overlap);
        });
    });

    it('should return the jackpot if enabled and rolled', () => {
        mockExpectedRoll(100);
        const expected = new GambleResult(GambleResultType.Jackpot, 100);
        expect(gamblingMode.winnings(200, true)).toEqual(expected);
    });

    it('should return a neutral result if the jackpot is rolled but disabled', () => {
        mockExpectedRoll(100);
        const expected = new GambleResult(GambleResultType.Neutral, 100);
        expect(gamblingMode.winnings(200, false)).toEqual(expected);
    });

    it('should return a neutral result for multiplier 0', () => {
        const expected = new GambleResult(GambleResultType.Neutral, 50);

        mockExpectedRoll(50);
        expect(gamblingMode.winnings(200, false)).toEqual(expected);
        mockExpectedRoll(50);
        expect(gamblingMode.winnings(200, true)).toEqual(expected);
    });

    it('should return a losing result for multiplier < 0', () => {
        const expected = new GambleResult(GambleResultType.Lost, 40, 200);

        mockExpectedRoll(40);
        expect(gamblingMode.winnings(200, false)).toEqual(expected);
        mockExpectedRoll(40);
        expect(gamblingMode.winnings(200, true)).toEqual(expected);
    });

    it('should return a winning result for multiplier > 0', () => {
        const expected = new GambleResult(GambleResultType.Won, 90, 600);

        mockExpectedRoll(90);
        expect(gamblingMode.winnings(200, false)).toEqual(expected);
        mockExpectedRoll(90);
        expect(gamblingMode.winnings(200, true)).toEqual(expected);
    });
});
