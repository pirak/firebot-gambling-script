import { GambleModePercentage } from '../../src/model/gamble-mode-percentage';
import { GambleResult, GambleResultType } from '../../src/model/gamble-result';
import { mockExpectedRoll } from '../helpers';

describe('The Gambling Mode Percentage', () => {
    const gamblingMode = new GambleModePercentage();

    it('should return the jackpot when 100 was rolled', async () => {
        mockExpectedRoll(100);
        const expected = new GambleResult(GambleResultType.Jackpot, 100, 0);
        expect(gamblingMode.winnings(200)).toEqual(expected);
    });

    it('should return the entered amount when 100 was rolled with disabled jackpot', async () => {
        mockExpectedRoll(100);
        const expected = new GambleResult(GambleResultType.Won, 100, 200);
        expect(gamblingMode.winnings(200, false)).toEqual(expected);
    });

    it('should return a neutral result when 50 was rolled', async () => {
        mockExpectedRoll(50);
        const expected = new GambleResult(GambleResultType.Neutral, 50, 0);
        expect(gamblingMode.winnings(200)).toEqual(expected);
    });

    it('should return a winning result with amount 980 when 99 was rolled with entry 1000', async () => {
        mockExpectedRoll(99);
        const expected = new GambleResult(GambleResultType.Won, 99, 980);
        expect(gamblingMode.winnings(1000)).toEqual(expected);
    });

    it('should return a losing result with amount 980 when 1 was rolled with entry 1000', async () => {
        mockExpectedRoll(1);
        const expected = new GambleResult(GambleResultType.Lost, 1, 980);
        expect(gamblingMode.winnings(1000)).toEqual(expected);
    });

    it('should return a winning result with amount 20 when 51 was rolled with entry 1000', async () => {
        mockExpectedRoll(51);
        const expected = new GambleResult(GambleResultType.Won, 51, 20);
        expect(gamblingMode.winnings(1000)).toEqual(expected);
    });

    it('should return a losing result with amount 20 when 49 was rolled with entry 1000', async () => {
        mockExpectedRoll(49);
        const expected = new GambleResult(GambleResultType.Lost, 49, 20);
        expect(gamblingMode.winnings(1000)).toEqual(expected);
    });

    it('should return a losing result with amount 1000 when 0 was rolled with entry 1000', async () => {
        mockExpectedRoll(0);
        const expected = new GambleResult(GambleResultType.Lost, 0, 1000);
        expect(gamblingMode.winnings(1000)).toEqual(expected);
    });

    it('should return a losing result with amount 400 when 30 was rolled with entry 1000', async () => {
        mockExpectedRoll(30);
        const expected = new GambleResult(GambleResultType.Lost, 30, 400);
        expect(gamblingMode.winnings(1000)).toEqual(expected);
    });

    it('should return a losing result with amount 600 when 20 was rolled with entry 1000', async () => {
        mockExpectedRoll(20);
        const expected = new GambleResult(GambleResultType.Lost, 20, 600);
        expect(gamblingMode.winnings(1000)).toEqual(expected);
    });
});
