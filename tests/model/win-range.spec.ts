// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2
import { NumRange } from '../../src/model/util/range';
import { WinRange } from '../../src/model/win-range';

describe('WinRange', () => {
    it('should be creatable from a jackpot range', () => {
        const range = { from: 2, to: 5, rangeType: 'Jackpot' };
        const r1 = WinRange.fromRange(range);

        const expected = WinRange.jackpot(new NumRange(2, 5));
        expect(r1).toEqual(expected);
    });

    it('should be creatable from a regular range with multiplier', () => {
        const range = { from: 1, to: 5, rangeType: 'Normal' };
        const r1 = WinRange.fromRange(range);

        const expected = WinRange.regular(new NumRange(1, 5), 0);
        expect(r1).toEqual(expected);
    });

    it('should be creatable from a regular range', () => {
        const range = { from: 2, to: 10, rangeType: 'Normal', mult: 3 };
        const r1 = WinRange.fromRange(range);

        const expected = WinRange.regular(new NumRange(2, 10), 3);
        expect(r1).toEqual(expected);
    });

    it('should mark if any ranges overlap', () => {
        const r1 = WinRange.regular(new NumRange(0, 3), 1);
        const r2 = WinRange.jackpot(new NumRange(3, 10));
        const r3 = WinRange.regular(new NumRange(11, 20), 1);

        const ranges = [r1, r2, r3];
        expect(WinRange.anyRangeOverlap(ranges)).toBe(true);
    });

    it('should recognise non-overlapping ranges', () => {
        const r1 = WinRange.regular(new NumRange(0, 3), 1);
        const r2 = WinRange.jackpot(new NumRange(7, 10));
        const r3 = WinRange.regular(new NumRange(11, 20), 1);

        const ranges = [r1, r2, r3];
        expect(WinRange.anyRangeOverlap(ranges)).toBe(false);
    });

    it('should let an empty range list never cover any range', () => {
        expect(WinRange.coverFullRange([], new NumRange(0, 0))).toBe(false);
        expect(WinRange.coverFullRange([], new NumRange(12, 100))).toBe(false);
    });

    it('should mark if a single range covers the target range fully', () => {
        const r1 = WinRange.regular(new NumRange(0, 100), 1);

        const target1 = new NumRange(3, 40);
        expect(WinRange.coverFullRange([r1], target1)).toBe(true);

        const target2 = new NumRange(0, 100);
        expect(WinRange.coverFullRange([r1], target2)).toBe(true);
    });

    it('should mark if a single range does not cover the target range', () => {
        const r1 = WinRange.regular(new NumRange(10, 40), 1);

        expect(WinRange.coverFullRange([r1], new NumRange(0, 100))).toBe(false);
        expect(WinRange.coverFullRange([r1], new NumRange(9, 40))).toBe(false);
        expect(WinRange.coverFullRange([r1], new NumRange(10, 41))).toBe(false);
    });

    it('should mark if the ranges do not cover a full range', () => {
        const r1 = WinRange.jackpot(new NumRange(30, 100));
        const r2 = WinRange.jackpot(new NumRange(20, 29));
        const r3 = WinRange.jackpot(new NumRange(0, 10));

        const ranges = [r1, r2, r3];
        expect(WinRange.coverFullRange(ranges, new NumRange(0, 100))).toBe(false);
    });

    it('should mark if the ranges do cover a full range', () => {
        const r1 = WinRange.jackpot(new NumRange(30, 100));
        const r2 = WinRange.jackpot(new NumRange(20, 29));
        const r3 = WinRange.jackpot(new NumRange(0, 19));

        const ranges = [r1, r2, r3];
        expect(WinRange.coverFullRange(ranges, new NumRange(0, 100))).toBe(true);
    });

    it('should recognise covering ranges when one has only length one', () => {
        const ranges = [
            WinRange.regular(new NumRange(0, 49), -1),
            WinRange.regular(new NumRange(50, 50), 0),
            WinRange.regular(new NumRange(51, 99), 1),
            WinRange.jackpot(new NumRange(100, 100)),
        ];
        expect(WinRange.coverFullRange(ranges, new NumRange(0, 100))).toBe(true);
    });

    it('should mark if the ranges cover a full range with overlap', () => {
        const r1 = WinRange.jackpot(new NumRange(0, 60));
        const r2 = WinRange.jackpot(new NumRange(40, 100));

        const target = new NumRange(0, 100);
        expect(WinRange.coverFullRange([r2, r1], target)).toBe(true);
        expect(WinRange.coverFullRange([r1, r2], target)).toBe(true);
    });

    it('should mark if the ranges cover a full range when one range is fully included in the other', () => {
        const r1 = WinRange.jackpot(new NumRange(0, 60));
        const r2 = WinRange.jackpot(new NumRange(40, 100));
        const r3 = WinRange.jackpot(new NumRange(1, 20));

        const target = new NumRange(0, 100);
        expect(WinRange.coverFullRange([r2, r1, r3], target)).toBe(true);
        expect(WinRange.coverFullRange([r1, r2, r3], target)).toBe(true);
    });
});
