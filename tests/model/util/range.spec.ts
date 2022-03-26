import { NumRange } from '../../../src/model/util/range';

describe('NumRange', () => {
    it('should not overlap if the bounds do not overlap', () => {
        const r1 = new NumRange(0, 3);
        const r2 = new NumRange(4, 10);

        expect(r1.overlaps(r2)).toBe(false);
        expect(r2.overlaps(r1)).toBe(false);
    });

    it('should overlap if one range fully includes the other', () => {
        const r1 = new NumRange(1, 3);
        const r2 = new NumRange(0, 10);

        expect(r1.overlaps(r2)).toBe(true);
        expect(r2.overlaps(r1)).toBe(true);
    });

    it('should overlap if the lower bounds overlap', () => {
        const r1 = new NumRange(0, 6);
        const r2 = new NumRange(5, 10);

        expect(r1.overlaps(r2)).toBe(true);
        expect(r2.overlaps(r1)).toBe(true);
    });

    it('should overlap if the upper bound of a range is equal to the lower bound of the other', () => {
        const r1 = new NumRange(0, 5);
        const r2 = new NumRange(5, 10);

        expect(r1.overlaps(r2)).toBe(true);
        expect(r2.overlaps(r1)).toBe(true);
    });

    it('should contain its bounds', () => {
        const r = new NumRange(5, 10);

        expect(r.contains(5)).toBe(true);
        expect(r.contains(10)).toBe(true);
    });

    it('should contain any value between its bounds', () => {
        const r = new NumRange(0, 7);

        expect(r.contains(1)).toBe(true);
        expect(r.contains(4)).toBe(true);
        expect(r.contains(6)).toBe(true);
    });

    it('should include another identical range', () => {
        const r1 = new NumRange(0, 100);
        expect(r1.includes(r1)).toBe(true);
    });

    it('should include another range', () => {
        const r1 = new NumRange(0, 100);
        expect(r1.includes(new NumRange(1, 100))).toBe(true);
        expect(r1.includes(new NumRange(0, 99))).toBe(true);
        expect(r1.includes(new NumRange(1, 99))).toBe(true);
    });

    it('should not include other ranges with higher upper bounds', () => {
        const r1 = new NumRange(0, 100);
        expect(r1.includes(new NumRange(3, 101))).toBe(false);
        expect(r1.includes(new NumRange(120, 140))).toBe(false);
    });

    it('should not include other ranges with lower lower bounds', () => {
        const r1 = new NumRange(0, 100);
        expect(r1.includes(new NumRange(-1, 100))).toBe(false);
        expect(r1.includes(new NumRange(-1, 80))).toBe(false);
        expect(r1.includes(new NumRange(-10, 0))).toBe(false);
    });

    it('should sort ranges by their lower bounds', () => {
        const r1 = new NumRange(0, 5);
        const r2 = new NumRange(13, 20);
        const r4 = new NumRange(3, 10);
        const r3 = new NumRange(2, 12);

        const ranges = [r1, r2, r3, r4];
        const expectedOrder = [r1, r3, r4, r2];

        const actualOrder = ranges.sort((a, b) => a.compareTo(b));
        expect(actualOrder).toEqual(expectedOrder);
    });

    it('should sort ranges by the upper bound if the lower bound is equal', () => {
        const r1 = new NumRange(0, 5);
        const r2 = new NumRange(0, 3);

        const ranges = [r1, r2];
        const expectedOrder = [r2, r1];

        const actualOrder = ranges.sort((a, b) => a.compareTo(b));
        expect(actualOrder).toEqual(expectedOrder);
    });
});
