import { GambleHandler } from '../src/gamble-handler';
import { GambleModePercentage } from '../src/model/gamble-mode-percentage';
import { ArgumentsOf, replaceMessageParams, mockExpectedRoll } from './helpers';
import { ScriptModules } from 'firebot-custom-scripts-types';
import { defaultParams, Params } from '../src/main';
import { GambleResult, GambleResultType } from '../src/model/gamble-result';
import { ChatMessageEffect } from '../src/helpers/effects/chat-message-effect';
import { CurrencyEffect, CurrencyAction } from '../src/helpers/effects/currency-effect';
import { UpdateCounterEffect, UpdateCounterEffectMode } from '../src/helpers/effects/update-counter-effect';
import { GambleEntry } from '../src/model/gamble-entry';

const mockLogger = {
    info: jest.fn<void, ArgumentsOf<ScriptModules['logger']['info']>>(),
    debug: jest.fn<void, ArgumentsOf<ScriptModules['logger']['debug']>>(),
    warn: jest.fn<void, ArgumentsOf<ScriptModules['logger']['warn']>>(),
    error: jest.fn<void, ArgumentsOf<ScriptModules['logger']['error']>>(),
};

const gambleHandler = new GambleHandler(new GambleModePercentage(), mockLogger, 100);

const params = defaultParams();
params.currentJackpotAmount = '1000';
params.userCurrentPoints = '10000';

describe('The Gambling Handler Message Replacer', () => {
    const messageReplacer = (params: Params, gambleResult: GambleResult, message: string) =>
        // @ts-ignore
        GambleHandler.replaceMessagePlaceholders(params, gambleResult, message);

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
    const effectCreator = (params: Params, result: GambleResult) =>
        // @ts-ignore
        gambleHandler.gambleResultEffects(params, 'pirak__', result);

    it('should for neutral results only create a chat message', async () => {
        const result = new GambleResult(GambleResultType.Neutral, 50);
        const expectedEffects = [new ChatMessageEffect(replaceMessageParams(defaultParams().messageWon, 50, 0, 10000))];

        expect(effectCreator(params, result)).toEqual(expectedEffects);
    });

    it('should for winning results add points to the user and create a chat message', async () => {
        const result = new GambleResult(GambleResultType.Won, 52, 120);
        const expectedEffects = [
            new CurrencyEffect(defaultParams().currencyId, CurrencyAction.Add, 'pirak__', 120),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageWon, 52, 120, 10120)),
        ];

        expect(effectCreator(params, result)).toEqual(expectedEffects);
    });

    it('should for losing results add points to the user, add points to the jackpot and create a chat message', async () => {
        const result = new GambleResult(GambleResultType.Lost, 48, 120);
        const expectedEffects = [
            new CurrencyEffect(defaultParams().currencyId, CurrencyAction.Remove, 'pirak__', 120),
            new UpdateCounterEffect(params.jackpotCounterId, UpdateCounterEffectMode.Increment, 120),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageLost, 48, 120, 10000 - 120)),
        ];

        expect(effectCreator(params, result)).toEqual(expectedEffects);
    });

    it('should for jackpot results add points to the user, reset the jackpot and create a chat message', async () => {
        const result = new GambleResult(GambleResultType.Jackpot, 100);
        const expectedEffects = [
            new CurrencyEffect(defaultParams().currencyId, CurrencyAction.Add, 'pirak__', 1000),
            new UpdateCounterEffect(params.jackpotCounterId, UpdateCounterEffectMode.Set, 0),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageJackpotWon, 100, 1000, 10000 + 1000)),
        ];

        expect(effectCreator(params, result)).toEqual(expectedEffects);
    });
});

describe('The Gambling Handler', () => {
    it('should for neutral results only create a chat message', async () => {
        const entry = new GambleEntry('pirak__', 10000, 1000);
        mockExpectedRoll(50);
        const expectedEffects = [new ChatMessageEffect(replaceMessageParams(defaultParams().messageWon, 50, 0, 10000))];

        expect(gambleHandler.handle(params, entry)).toEqual(expectedEffects);
    });

    it('should for winning results add points to the user and create a chat message', async () => {
        const entry = new GambleEntry('pirak__', 10000, 1000);
        mockExpectedRoll(52);
        const expectedEffects = [
            new CurrencyEffect(defaultParams().currencyId, CurrencyAction.Add, 'pirak__', 40),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageWon, 52, 40, 10040)),
        ];

        expect(gambleHandler.handle(params, entry)).toEqual(expectedEffects);
    });

    it('should for losing results add points to the user, add points to the jackpot and create a chat message', async () => {
        const entry = new GambleEntry('pirak__', 10000, 1000);
        mockExpectedRoll(48);
        const expectedEffects = [
            new CurrencyEffect(defaultParams().currencyId, CurrencyAction.Remove, 'pirak__', 40),
            new UpdateCounterEffect(params.jackpotCounterId, UpdateCounterEffectMode.Increment, 40),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageLost, 48, 40, 10000 - 40)),
        ];

        expect(gambleHandler.handle(params, entry)).toEqual(expectedEffects);
    });

    it('should for jackpot results add points to the user, reset the jackpot and create a chat message', async () => {
        const entry = new GambleEntry('pirak__', 10000, 1000);
        mockExpectedRoll(100);
        const expectedEffects = [
            new CurrencyEffect(defaultParams().currencyId, CurrencyAction.Add, 'pirak__', 1000),
            new UpdateCounterEffect(params.jackpotCounterId, UpdateCounterEffectMode.Set, 0),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageJackpotWon, 100, 1000, 10000 + 1000)),
        ];

        expect(gambleHandler.handle(params, entry)).toEqual(expectedEffects);
    });
});
