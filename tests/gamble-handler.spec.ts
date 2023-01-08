import { defaultParams, Params } from '../src/gamble-effect';
import { GambleHandler } from '../src/gamble-handler';
import { ChatMessageEffect } from '../src/helpers/effects/chat-message-effect';
import { CurrencyAction, CurrencyEffect } from '../src/helpers/effects/currency-effect';
import { UpdateCounterEffect, UpdateCounterEffectMode } from '../src/helpers/effects/update-counter-effect';
import { GambleEntry } from '../src/model/gamble-entry';
import { GambleModePercentage } from '../src/model/gamble-mode-percentage';
import { GambleResult, GambleResultType } from '../src/model/gamble-result';
import { ArgumentsOf, mockExpectedRoll, replaceMessageParams } from './helpers';
import { ScriptModules } from 'firebot-custom-scripts-types';

const mockLogger = {
    info: jest.fn<void, ArgumentsOf<ScriptModules['logger']['info']>>(),
    debug: jest.fn<void, ArgumentsOf<ScriptModules['logger']['debug']>>(),
    warn: jest.fn<void, ArgumentsOf<ScriptModules['logger']['warn']>>(),
    error: jest.fn<void, ArgumentsOf<ScriptModules['logger']['error']>>(),
};

const params = defaultParams();

describe('The Gambling Handler Message Replacer', () => {
    const messageReplacer = (params: Params, gambleResult: GambleResult, message: string) =>
        // @ts-ignore
        GambleHandler.replaceMessagePlaceholders(message, params, gambleResult, 10000, 1000);

    it('should replace roll, amount, and newTotal in a neutral message', async () => {
        const result = new GambleResult(GambleResultType.Neutral, 50, 0);
        const messageExpected = replaceMessageParams(defaultParams().messageWon, 50, 0, 10000);

        const messageActual = messageReplacer(params, result, params.messageWon);
        expect(messageActual).toEqual(messageExpected);
    });

    it('should replace roll, amount, and newTotal in a winning message', async () => {
        const result = new GambleResult(GambleResultType.Won, 52, 120);
        const messageExpected = replaceMessageParams(defaultParams().messageWon, 52, 120, 10120);

        const messageActual = messageReplacer(params, result, params.messageWon);
        expect(messageActual).toEqual(messageExpected);
    });

    it('should replace roll, amount, and newTotal in a losing message', async () => {
        const result = new GambleResult(GambleResultType.Lost, 48, 120);
        const messageExpected = replaceMessageParams(defaultParams().messageLost, 48, 120, 10000 - 120);

        const messageActual = messageReplacer(params, result, params.messageLost);
        expect(messageActual).toEqual(messageExpected);
    });

    it('should replace roll, amount, and newTotal in a jackpot message', async () => {
        const result = new GambleResult(GambleResultType.Jackpot, 100);
        const messageExpected = replaceMessageParams(defaultParams().messageJackpotWon, 100, 1000, 10000 + 1000);

        const messageActual = messageReplacer(params, result, params.messageJackpotWon);
        expect(messageActual).toEqual(messageExpected);
    });
});

describe('The Gambling Handler Effect Creator', () => {
    const gambleHandler = new GambleHandler(new GambleModePercentage(), mockLogger, 100, 100);
    const gambleEntry = new GambleEntry('pirak__', 10000, 1000);

    const effectCreator = (params: Params, entry: GambleEntry, result: GambleResult) =>
        // @ts-ignore
        gambleHandler.gambleResultEffects(params, entry, result, 1000);

    it('should for neutral results only create a chat message', async () => {
        const result = new GambleResult(GambleResultType.Neutral, 50);
        const expectedEffects = [new ChatMessageEffect(replaceMessageParams(defaultParams().messageWon, 50, 0, 10000))];

        expect(effectCreator(params, gambleEntry, result)).toEqual(expectedEffects);
    });

    it('should for winning results add points to the user and create a chat message', async () => {
        const result = new GambleResult(GambleResultType.Won, 52, 120);
        const expectedEffects = [
            new CurrencyEffect(defaultParams().currencyId, CurrencyAction.Add, 'pirak__', 120),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageWon, 52, 120, 10120)),
        ];

        expect(effectCreator(params, gambleEntry, result)).toEqual(expectedEffects);
    });

    it('should for losing results add points to the user, add points to the jackpot and create a chat message', async () => {
        const result = new GambleResult(GambleResultType.Lost, 48, 120);
        const expectedEffects = [
            new CurrencyEffect(defaultParams().currencyId, CurrencyAction.Remove, 'pirak__', 120),
            new UpdateCounterEffect(params.jackpotCounterId, UpdateCounterEffectMode.Increment, 120),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageLost, 48, 120, 10000 - 120)),
        ];

        expect(effectCreator(params, gambleEntry, result)).toEqual(expectedEffects);
    });

    it('should for jackpot results add points to the user, reset the jackpot and create a chat message', async () => {
        const result = new GambleResult(GambleResultType.Jackpot, 100);
        const expectedEffects = [
            new CurrencyEffect(defaultParams().currencyId, CurrencyAction.Add, 'pirak__', 1000),
            new UpdateCounterEffect(params.jackpotCounterId, UpdateCounterEffectMode.Set, 0),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageJackpotWon, 100, 1000, 10000 + 1000)),
        ];

        expect(effectCreator(params, gambleEntry, result)).toEqual(expectedEffects);
    });
});

describe('The Gambling Handler', () => {
    const gambleHandler = new GambleHandler(new GambleModePercentage(), mockLogger, 100, 100);

    it('should for neutral results only create a chat message', async () => {
        const entry = new GambleEntry('pirak__', 10000, 1000);
        mockExpectedRoll(50);
        const expectedEffects = [new ChatMessageEffect(replaceMessageParams(defaultParams().messageWon, 50, 0, 10000))];

        expect(gambleHandler.handle(params, entry, 1000)).toEqual(expectedEffects);
    });

    it('should for winning results add points to the user and create a chat message', async () => {
        const entry = new GambleEntry('pirak__', 10000, 1000);
        mockExpectedRoll(52);
        const expectedEffects = [
            new CurrencyEffect(defaultParams().currencyId, CurrencyAction.Add, 'pirak__', 40),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageWon, 52, 40, 10040)),
        ];

        expect(gambleHandler.handle(params, entry, 1000)).toEqual(expectedEffects);
    });

    it('should for losing results add points to the user, add points to the jackpot and create a chat message', async () => {
        const entry = new GambleEntry('pirak__', 10000, 1000);
        mockExpectedRoll(48);
        const expectedEffects = [
            new CurrencyEffect(defaultParams().currencyId, CurrencyAction.Remove, 'pirak__', 40),
            new UpdateCounterEffect(params.jackpotCounterId, UpdateCounterEffectMode.Increment, 40),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageLost, 48, 40, 10000 - 40)),
        ];

        expect(gambleHandler.handle(params, entry, 1000)).toEqual(expectedEffects);
    });

    it('should for jackpot results add points to the user, reset the jackpot and create a chat message', async () => {
        const entry = new GambleEntry('pirak__', 10000, 1000);
        mockExpectedRoll(100);
        const expectedEffects = [
            new CurrencyEffect(defaultParams().currencyId, CurrencyAction.Add, 'pirak__', 1000),
            new UpdateCounterEffect(params.jackpotCounterId, UpdateCounterEffectMode.Set, 0),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageJackpotWon, 100, 1000, 10000 + 1000)),
        ];

        expect(gambleHandler.handle(params, entry, 1000)).toEqual(expectedEffects);
    });

    it('should disable the jackpot for jackpotPercents <= 0', async () => {
        const mode = new GambleModePercentage();
        const mockFn = jest
            .spyOn(mode, 'winnings')
            .mockImplementation(() => new GambleResult(GambleResultType.Lost, 40, 120));

        const entry = new GambleEntry('pirak__', 10000, 1000);
        const gambleHandler = new GambleHandler(mode, mockLogger, 100, 0);

        const expectedEffects = [
            new CurrencyEffect(defaultParams().currencyId, CurrencyAction.Remove, 'pirak__', 120),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageLost, 40, 120, 10000 - 120)),
        ];

        expect(gambleHandler.handle(params, entry, 1000)).toEqual(expectedEffects);
        expect(mockFn).toHaveBeenCalledWith(1000, false);

        // jackpotPercent -1 should be used as 0
        const gambleHandler2 = new GambleHandler(mode, mockLogger, 100, -1);
        expect(gambleHandler2.handle(params, entry, 1000)).toEqual(expectedEffects);
        expect(mockFn).toHaveBeenCalledWith(1000, false);
    });

    it('should take the jackpot percent into account for values > 0', async () => {
        const mode = new GambleModePercentage();
        const mockFn = jest
            .spyOn(mode, 'winnings')
            .mockImplementationOnce(() => new GambleResult(GambleResultType.Lost, 40, 120));

        const entry = new GambleEntry('pirak__', 10000, 1000);
        const gambleHandler = new GambleHandler(mode, mockLogger, 100, 50);

        const expectedEffects = [
            new CurrencyEffect(defaultParams().currencyId, CurrencyAction.Remove, 'pirak__', 120),
            new UpdateCounterEffect(params.jackpotCounterId, UpdateCounterEffectMode.Increment, 60),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageLost, 40, 120, 10000 - 120)),
        ];

        expect(gambleHandler.handle(params, entry, 1000)).toEqual(expectedEffects);
        expect(mockFn).toHaveBeenCalledWith(1000, true);
    });

    it('should round down the amount added to the jackpot', async () => {
        const mode = new GambleModePercentage();
        const mockFn = jest
            .spyOn(mode, 'winnings')
            .mockImplementationOnce(() => new GambleResult(GambleResultType.Lost, 40, 49));

        const entry = new GambleEntry('pirak__', 10000, 1000);
        const gambleHandler = new GambleHandler(mode, mockLogger, 100, 50);

        const expectedEffects = [
            new CurrencyEffect(defaultParams().currencyId, CurrencyAction.Remove, 'pirak__', 49),
            new UpdateCounterEffect(params.jackpotCounterId, UpdateCounterEffectMode.Increment, 24),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageLost, 40, 49, 10000 - 49)),
        ];

        expect(gambleHandler.handle(params, entry, 1000)).toEqual(expectedEffects);
        expect(mockFn).toHaveBeenCalledWith(1000, true);
    });
});
