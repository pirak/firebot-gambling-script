// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2
import { GambleModeThreshold } from '../../src/model/gamble-mode-threshold';
import { GambleResult, GambleResultType } from '../../src/model/gamble-result';
import { mockExpectedRoll } from '../helpers';

describe('The Gambling Mode Threshold', () => {
    const gambleMode = new GambleModeThreshold({ maxRoll: 100, threshold: 60, jackpotTarget: 70, winPointsFactor: 3 });

    it('should return the jackpot if enabled and rolled', () => {
        mockExpectedRoll(70);
        const expected = new GambleResult(GambleResultType.Jackpot, 70);
        expect(gambleMode.winnings(200, true)).toEqual(expected);
    });

    it('should return the regular value instead of the jackpot if disabled', () => {
        // winning roll
        mockExpectedRoll(70);
        const expected = new GambleResult(GambleResultType.Won, 70, 600);
        expect(gambleMode.winnings(200, false)).toEqual(expected);

        // jackpot target can also be placed in the regular losing range
        mockExpectedRoll(40);
        const gambleMode2 = new GambleModeThreshold({
            maxRoll: 100,
            threshold: 60,
            jackpotTarget: 40,
            winPointsFactor: 3,
        });
        const expected2 = new GambleResult(GambleResultType.Lost, 40, 200);
        expect(gambleMode2.winnings(200, false)).toEqual(expected2);
    });

    it('should return a neutral result if exactly the threshold is rolled', () => {
        const expected = new GambleResult(GambleResultType.Neutral, 60, 0);

        mockExpectedRoll(60);
        expect(gambleMode.winnings(200, true)).toEqual(expected);
        mockExpectedRoll(60);
        expect(gambleMode.winnings(200, false)).toEqual(expected);
    });

    it('should return the jackpot if enabled and target identical to threshold', () => {
        const gambleMode = new GambleModeThreshold({
            maxRoll: 100,
            threshold: 60,
            jackpotTarget: 60,
            winPointsFactor: 3,
        });
        const expected = new GambleResult(GambleResultType.Jackpot, 60);

        mockExpectedRoll(60);
        expect(gambleMode.winnings(200, true)).toEqual(expected);
    });

    it('should return a neutral result if jackpot disabled and target identical to threshold', () => {
        const gambleMode = new GambleModeThreshold({
            maxRoll: 100,
            threshold: 60,
            jackpotTarget: 60,
            winPointsFactor: 3,
        });
        const expected = new GambleResult(GambleResultType.Neutral, 60, 0);

        mockExpectedRoll(60);
        expect(gambleMode.winnings(200, false)).toEqual(expected);
    });

    it('should return a losing result if the roll is smaller than the threshold', () => {
        const expected = new GambleResult(GambleResultType.Won, 80, 600);

        mockExpectedRoll(80);
        expect(gambleMode.winnings(200, true)).toEqual(expected);
        mockExpectedRoll(80);
        expect(gambleMode.winnings(200, false)).toEqual(expected);
    });

    it('should return a winning result if the roll is bigger than the threshold', () => {
        const expected = new GambleResult(GambleResultType.Lost, 30, 200);

        mockExpectedRoll(30);
        expect(gambleMode.winnings(200, true)).toEqual(expected);
        mockExpectedRoll(30);
        expect(gambleMode.winnings(200, false)).toEqual(expected);
    });
});
