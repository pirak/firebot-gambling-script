// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2
import { RunRequest } from 'firebot-custom-scripts-types';
import { Effects } from 'firebot-custom-scripts-types/types/effects';
import { Counter } from 'firebot-custom-scripts-types/types/modules/counter-manager';
import { CurrencyAdjustType } from 'firebot-custom-scripts-types/types/modules/currency-db';
import { Logger } from 'firebot-custom-scripts-types/types/modules/logger';

import { buildGambleEffect, defaultParams, handle, Params } from '../src/gamble-effect';
import { GambleHandler } from '../src/gamble-handler';
import { ChatMessageEffect } from '../src/helpers/effects/chat-message-effect';
import { CurrencyAction, CurrencyEffect } from '../src/helpers/effects/currency-effect';
import { UpdateCounterEffect, UpdateCounterEffectMode } from '../src/helpers/effects/update-counter-effect';
import { ScriptParams } from '../src/main';
import { GambleModePercentage } from '../src/model/gamble-mode-percentage';
import { mockExpectedRoll, replaceMessageParams } from './helpers';

import Trigger = Effects.Trigger;

const currencyId = '7b9ac050-a096-11eb-9ce3-69b33571b547';
const jackpotId = '71dd1e86-178d-491d-8f61-9c5851faf8a8';

function addManagersToRunRequest(
    runRequest: RunRequest<ScriptParams>,
    username: string = 'pirak__',
    userPoints: number = 10000,
    jackpotValue: number = 1000,
): void {
    runRequest.modules.logger = {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        info: (msg: string) => {},
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        warn: (msg: string) => {},
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        debug: (msg: string) => {},
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        error: (msg: string) => {},
    };

    // @ts-ignore
    runRequest.modules.currencyDb = {
        getCurrencies: () => {
            return [
                {
                    id: currencyId,
                    name: 'points',
                    active: true,
                    limit: 0,
                    transfer: 'Allow',
                    interval: 5,
                    payout: 10,
                    offline: 0,
                    bonus: {},
                },
                {
                    id: '8c0ac050-a096-11eb-9ce3-69b33571b547',
                    name: 'coins',
                    active: true,
                    limit: 0,
                    transfer: 'Allow',
                    interval: 5,
                    payout: 10,
                    offline: 0,
                    bonus: {},
                },
            ];
        },
        getUserCurrencyAmount: async (name: string, id: string) => {
            if (name === username && id === '7b9ac050-a096-11eb-9ce3-69b33571b547') {
                return userPoints;
            }
            return 0;
        },
    };

    const counter: Counter = {
        id: jackpotId,
        name: 'jackpot',
        saveToTxtFile: false,
        value: jackpotValue,
        maximumEffects: { id: '', list: [] },
        minimumEffects: { id: '', list: [] },
        updateEffects: { id: '', list: [] },
    };

    runRequest.modules.counterManager = {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        createCounter(name: string): Counter {
            return counter;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        updateCounterValue(id: string, value: number, overridePreviousValue: boolean): Promise<void> {
            return Promise.resolve(undefined);
        },
        getCounterByName: (name: string) => {
            if (name.toLowerCase() === counter.name) {
                return counter;
            }
            return undefined;
        },
        getCounter: (id: string) => {
            if (id === counter.id) {
                return counter;
            }
            return undefined;
        },
    };

    // @ts-ignore
    runRequest.modules.currencyDb = {
        adjustCurrencyForUser: async (
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            username: string,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            id: string,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            amount: number,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            action: CurrencyAdjustType | undefined,
        ) => {
            return true;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        getUserCurrencyAmount: async (username: string, id: string) => {
            return 10000;
        },
    };

    runRequest.modules.twitchChat = {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        sendChatMessage(message: string, whisperTarget?: string, accountType?: 'bot' | 'streamer') {},
    };
}

function runRequestBuilder(): RunRequest<ScriptParams> {
    const params = {};

    const runRequest = {
        parameters: params,
        modules: {},
        firebot: {},
        trigger: {
            type: 'command',
        },
    };
    // @ts-ignore
    addManagersToRunRequest(runRequest);

    // @ts-ignore
    return runRequest;
}

type EffectTrigger = {
    effect: Params;
    trigger: Trigger;
    sendDataToOverlay: (data: unknown, overlayInstance?: string) => void;
};

function effectTriggerBuilder(username: string, args: string[]): EffectTrigger {
    const params = defaultParams();
    return {
        effect: params,
        trigger: {
            type: 'command',
            metadata: {
                username,
                userCommand: {
                    trigger: '!gamble',
                    args,
                },
            },
        },
        sendDataToOverlay: () => {},
    };
}

function gambleHandlerBuilder(logger: Logger) {
    return new GambleHandler(new GambleModePercentage(), logger, 100, 100);
}

describe('The Gamble Effect Handler', () => {
    it('should ignore runRequests that are not commands', async () => {
        const runRequest = runRequestBuilder();
        const gambleEffect = buildGambleEffect(runRequest);
        const trigger = effectTriggerBuilder('pirak__', []);
        trigger.trigger.type = 'manual';
        const debugMock = jest.spyOn(runRequest.modules.logger, 'debug');

        await gambleEffect.onTriggerEvent(trigger);
        expect(debugMock).toHaveBeenCalledWith('Trigger is not a command, ignoring...');
    });

    it('should not crash on runRequests with no userCommand', async () => {
        const runRequest = runRequestBuilder();
        const gambleEffect = buildGambleEffect(runRequest);
        const trigger = effectTriggerBuilder('pirak__', []);
        trigger.trigger.metadata.userCommand = undefined;

        await gambleEffect.onTriggerEvent(trigger);
    });

    it('should ignore runRequests with no command arguments', async () => {
        const runRequest = runRequestBuilder();
        const event = effectTriggerBuilder('pirak__', []);

        const effects = await handle(runRequest.modules, event, gambleHandlerBuilder(runRequest.modules.logger));
        expect(effects).toEqual([]);
    });

    it('should ignore runRequests with more than one command arguments', async () => {
        const runRequest = runRequestBuilder();
        const event = effectTriggerBuilder('pirak__', ['all', '123']);

        const effects = await handle(runRequest.modules, event, gambleHandlerBuilder(runRequest.modules.logger));
        expect(effects).toEqual([]);
    });

    it('should ignore runRequests with one invalid argument', async () => {
        const runRequest = runRequestBuilder();
        const event = effectTriggerBuilder('pirak__', ['all', '123']);

        const effects = await handle(runRequest.modules, event, gambleHandlerBuilder(runRequest.modules.logger));
        expect(effects).toEqual([]);
    });

    it('should return a message if the user entered too few points', async () => {
        const runRequest = runRequestBuilder();
        const event = effectTriggerBuilder('pirak__', ['20']);

        const expectedEffects = [
            new ChatMessageEffect(defaultParams().messageEntryBelowMinimum.replace('%min', String(100))),
        ];

        const effects = await handle(runRequest.modules, event, gambleHandlerBuilder(runRequest.modules.logger));
        expect(effects).toEqual(expectedEffects);
    });

    it('should do nothing if the user tried to enter more points than they have', async () => {
        const runRequest = runRequestBuilder();
        const event = effectTriggerBuilder('pirak__', ['20000']);

        const effects = await handle(runRequest.modules, event, gambleHandlerBuilder(runRequest.modules.logger));
        expect(effects).toEqual([]);
    });

    it('should return the result of the gamble handler if the argument is valid', async () => {
        const runRequest = runRequestBuilder();
        const event = effectTriggerBuilder('pirak__', ['20%']);

        mockExpectedRoll(100);
        const expectedEffects = [
            new CurrencyEffect(defaultParams().currencyId, CurrencyAction.Add, 'pirak__', 1000),
            new UpdateCounterEffect(event.effect.jackpotCounterId, UpdateCounterEffectMode.Set, 0),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageJackpotWon, 100, 1000, 10000 + 1000)),
        ];

        const effects = await handle(runRequest.modules, event, gambleHandlerBuilder(runRequest.modules.logger));
        expect(effects).toEqual(expectedEffects);
    });
});

describe('The Gamble Effect', () => {
    it('should execute the effects on a valid jackpot winning gamble', async () => {
        const runRequest = runRequestBuilder();
        const event = effectTriggerBuilder('pirak__', ['20%']);

        mockExpectedRoll(100);

        // @ts-ignore
        const adjustCurrencyMock = jest.spyOn(runRequest.modules.currencyDb, 'adjustCurrencyForUser');
        const updateCounterMock = jest.spyOn(runRequest.modules.counterManager, 'updateCounterValue');
        const chatMessageMock = jest.spyOn(runRequest.modules.twitchChat, 'sendChatMessage');

        await buildGambleEffect(runRequest).onTriggerEvent(event);
        expect(adjustCurrencyMock).toHaveBeenCalledWith('pirak__', currencyId, 1000, 'adjust');
        expect(updateCounterMock).toHaveBeenCalledWith(jackpotId, 0, true);
        expect(chatMessageMock).toHaveBeenCalledWith(
            'Rolled 100. $user won the jackpot of 1000 points and now has a total of 11000.',
            undefined,
            'bot',
        );
    });

    it('should execute the effects on a valid winning gamble', async () => {
        const runRequest = runRequestBuilder();
        const event = effectTriggerBuilder('pirak__', ['100']);
        event.effect.jackpotPercent = 40;

        mockExpectedRoll(80);

        // @ts-ignore
        const adjustCurrencyMock = jest.spyOn(runRequest.modules.currencyDb, 'adjustCurrencyForUser');
        const updateCounterMock = jest.spyOn(runRequest.modules.counterManager, 'updateCounterValue');
        const chatMessageMock = jest.spyOn(runRequest.modules.twitchChat, 'sendChatMessage');

        await buildGambleEffect(runRequest).onTriggerEvent(event);
        expect(adjustCurrencyMock).toHaveBeenCalledWith('pirak__', currencyId, 60, 'adjust');
        expect(updateCounterMock).toHaveBeenCalledTimes(0);
        expect(chatMessageMock).toHaveBeenCalledWith(
            'Rolled 80. $user won 60 points and now has a total of 10060.',
            undefined,
            'bot',
        );
    });

    it('should execute the effects on a valid losing gamble', async () => {
        const runRequest = runRequestBuilder();
        const event = effectTriggerBuilder('pirak__', ['100']);
        event.effect.jackpotPercent = 50;

        mockExpectedRoll(20);

        // @ts-ignore
        const adjustCurrencyMock = jest.spyOn(runRequest.modules.currencyDb, 'adjustCurrencyForUser');
        const updateCounterMock = jest.spyOn(runRequest.modules.counterManager, 'updateCounterValue');
        const chatMessageMock = jest.spyOn(runRequest.modules.twitchChat, 'sendChatMessage');

        await buildGambleEffect(runRequest).onTriggerEvent(event);
        expect(adjustCurrencyMock).toHaveBeenCalledWith('pirak__', currencyId, -60, 'adjust');
        expect(updateCounterMock).toHaveBeenCalledWith(jackpotId, 30, false);
        expect(chatMessageMock).toHaveBeenCalledWith(
            'Rolled 20. $user lost 60 points and now has a total of 9940.',
            undefined,
            'bot',
        );
    });

    it('should switch to the Threshold mode depending on the parameter mode', async () => {
        const runRequest = runRequestBuilder();
        const event = effectTriggerBuilder('pirak__', ['100']);
        event.effect.mode = 'Threshold';
        event.effect.jackpotPercent = 50;

        mockExpectedRoll(20);

        // @ts-ignore
        const adjustCurrencyMock = jest.spyOn(runRequest.modules.currencyDb, 'adjustCurrencyForUser');
        const updateCounterMock = jest.spyOn(runRequest.modules.counterManager, 'updateCounterValue');
        const chatMessageMock = jest.spyOn(runRequest.modules.twitchChat, 'sendChatMessage');

        await buildGambleEffect(runRequest).onTriggerEvent(event);
        expect(adjustCurrencyMock).toHaveBeenCalledWith('pirak__', currencyId, -100, 'adjust');
        expect(updateCounterMock).toHaveBeenCalledWith(jackpotId, 50, false);
        expect(chatMessageMock).toHaveBeenCalledWith(
            'Rolled 20. $user lost 100 points and now has a total of 9900.',
            undefined,
            'bot',
        );
    });
});

describe('The argument parser', () => {
    const parser = (totalPoints: number, arg: string) =>
        require('../src/gamble-effect').enteredPoints(totalPoints, arg);

    it('should parse all into the user’s total points', async () => {
        expect(parser(1000, 'all')).toEqual(1000);
    });

    it('should parse single digit percents', async () => {
        expect(parser(1000, '1%')).toEqual(10);
        expect(parser(1000, '8%')).toEqual(80);
    });

    it('should parse double digit percents', async () => {
        expect(parser(1000, '12%')).toEqual(120);
        expect(parser(1000, '99%')).toEqual(990);
    });

    it('should parse triple digit percents', async () => {
        expect(parser(1000, '100%')).toEqual(1000);
        expect(parser(1000, '101%')).toBeUndefined();
        expect(parser(1000, '233%')).toBeUndefined();
    });

    it('should parse regular numbers', async () => {
        expect(parser(1000, '1')).toEqual(1);
        expect(parser(1000, '12')).toEqual(12);
        expect(parser(1000, '100')).toEqual(100);
        expect(parser(1000, '233')).toEqual(233);
        expect(parser(1000, '10000')).toEqual(10000);
    });

    it('should not parse negative numbers', async () => {
        expect(parser(1000, '-1')).toBeUndefined();
        expect(parser(1000, '-100')).toBeUndefined();
    });

    it('should not parse zero', async () => {
        expect(parser(1000, '0')).toBeUndefined();
    });
});
