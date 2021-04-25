import customScript, { defaultParams, GamblingScript, Params } from '../src/main';
import { ArgumentsOf, replaceMessageParams, mockExpectedRoll } from './helpers';
import { RunRequest, ScriptModules } from 'firebot-custom-scripts-types';
import { CurrencyEffect, CurrencyAction } from '../src/helpers/effects/currency-effect';
import { UpdateCounterEffect, UpdateCounterEffectMode } from '../src/helpers/effects/update-counter-effect';
import { ChatMessageEffect } from '../src/helpers/effects/chat-message-effect';
import { Counter } from '../src/helpers/firebot-internals';

const mockLogger = {
    info: jest.fn<void, ArgumentsOf<ScriptModules['logger']['info']>>(),
    debug: jest.fn<void, ArgumentsOf<ScriptModules['logger']['debug']>>(),
    warn: jest.fn<void, ArgumentsOf<ScriptModules['logger']['warn']>>(),
    error: jest.fn<void, ArgumentsOf<ScriptModules['logger']['error']>>(),
};

test('index default export is the custom script', () => {
    expect(customScript).not.toBeUndefined();
    expect(customScript.run).not.toBeUndefined();
    expect(customScript.getScriptManifest).not.toBeUndefined();
    expect(customScript.getScriptManifest()).not.toBeUndefined();
    expect(customScript.getDefaultParameters).not.toBeUndefined();
    expect(customScript.getDefaultParameters()).not.toBeUndefined();
});

describe('The argument parser', () => {
    const parser = (totalPoints: number, arg: string) =>
        // @ts-ignore
        GamblingScript.enteredPoints(totalPoints, arg);

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

const currencyId = '7b9ac050-a096-11eb-9ce3-69b33571b547';
const jackpotId = '71dd1e86-178d-491d-8f61-9c5851faf8a8';

function addManagersToRunRequest(
    runRequest: RunRequest<Params>,
    username: string = 'pirak__',
    userPoints: number = 10000,
    jackpotValue: number = 1000,
): void {
    // @ts-ignore
    runRequest.modules.currencyDb = {
        getCurrencies: () => {
            return [
                {
                    id: currencyId,
                    name: 'points',
                },
                {
                    id: '8c0ac050-a096-11eb-9ce3-69b33571b547',
                    name: 'coins',
                },
            ];
        },
        getUserCurrencyAmount: (name: string, id: string) => {
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
    };

    // @ts-ignore
    runRequest.modules.counterManager = {
        getCounterByName: (name: string) => {
            if (name.toLowerCase() === counter.name) {
                return counter;
            }
            return null;
        },
        getCounter: (id: string) => {
            if (id === counter.id) {
                return counter;
            }
            return null;
        },
    };
}

describe('The handler', () => {
    it('should ignore runRequests that are not commands', async () => {
        const runRequest = ({
            parameters: defaultParams(),
            modules: { logger: mockLogger },
            trigger: {
                type: 'manual',
            },
        } as unknown) as RunRequest<any>;
        addManagersToRunRequest(runRequest);

        const res = await customScript.run(runRequest);
        expect(res.effects).toEqual([]);
    });

    it('should not crash on runRequests with no userCommand', async () => {
        const runRequest = ({
            parameters: defaultParams(),
            modules: { logger: mockLogger },
            trigger: {
                type: 'command',
                metadata: {
                    username: 'pirak__',
                },
            },
        } as unknown) as RunRequest<any>;
        addManagersToRunRequest(runRequest);

        const res = await customScript.run(runRequest);
        expect(res.effects).toEqual([]);
    });

    it('should ignore runRequests with no command arguments', async () => {
        const runRequest = ({
            parameters: defaultParams(),
            modules: { logger: mockLogger },
            trigger: {
                type: 'command',
                metadata: {
                    username: 'pirak__',
                    userCommand: {
                        trigger: '!gamble',
                        args: [],
                    },
                },
            },
        } as unknown) as RunRequest<any>;
        addManagersToRunRequest(runRequest);

        const res = await customScript.run(runRequest);
        expect(res.effects).toEqual([]);
    });

    it('should ignore runRequests with more than one command arguments', async () => {
        const runRequest = ({
            parameters: defaultParams(),
            modules: { logger: mockLogger },
            trigger: {
                type: 'command',
                metadata: {
                    username: 'pirak__',
                    userCommand: {
                        trigger: '!gamble',
                        args: ['all', '123'],
                    },
                },
            },
        } as unknown) as RunRequest<any>;
        addManagersToRunRequest(runRequest);

        const res = await customScript.run(runRequest);
        expect(res.effects).toEqual([]);
    });

    it('should ignore runRequests with one invalid argument', async () => {
        const runRequest = ({
            parameters: defaultParams(),
            modules: { logger: mockLogger },
            trigger: {
                type: 'command',
                metadata: {
                    username: 'pirak__',
                    userCommand: {
                        trigger: '!gamble',
                        args: ['2000%'],
                    },
                },
            },
        } as unknown) as RunRequest<any>;
        addManagersToRunRequest(runRequest);

        const res = await customScript.run(runRequest);
        expect(res.effects).toEqual([]);
    });

    it('should return a message if the user entered too few points', async () => {
        const runRequest = ({
            parameters: defaultParams(),
            modules: { logger: mockLogger },
            trigger: {
                type: 'command',
                metadata: {
                    username: 'pirak__',
                    userCommand: {
                        trigger: '!gamble',
                        args: ['20'],
                    },
                },
            },
        } as unknown) as RunRequest<any>;
        addManagersToRunRequest(runRequest);

        const expectedEffects = [
            new ChatMessageEffect(defaultParams().messageEntryBelowMinimum.replace('%min', String(100))),
        ];

        const res = await customScript.run(runRequest);
        expect(res.effects).toEqual(expectedEffects);
    });

    it('should do nothing if the user tried to enter more points than they have', async () => {
        const runRequest = ({
            parameters: defaultParams(),
            modules: { logger: mockLogger },
            trigger: {
                type: 'command',
                metadata: {
                    username: 'pirak__',
                    userCommand: {
                        trigger: '!gamble',
                        args: ['20000'],
                    },
                },
            },
        } as unknown) as RunRequest<any>;
        addManagersToRunRequest(runRequest);

        const res = await customScript.run(runRequest);
        expect(res.effects).toEqual([]);
    });

    it('should return the result of the gamble handler if the argument is valid', async () => {
        const runRequest = ({
            parameters: defaultParams(),
            modules: { logger: mockLogger },
            trigger: {
                type: 'command',
                metadata: {
                    username: 'pirak__',
                    userCommand: {
                        trigger: '!gamble',
                        args: ['20%'],
                    },
                },
            },
        } as unknown) as RunRequest<any>;
        addManagersToRunRequest(runRequest);

        mockExpectedRoll(100);
        const expectedEffects = [
            new CurrencyEffect(currencyId, CurrencyAction.Add, 'pirak__', 1000),
            new UpdateCounterEffect(jackpotId, UpdateCounterEffectMode.Set, 0),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageJackpotWon, 100, 1000, 10000 + 1000)),
        ];

        const res = await customScript.run(runRequest);
        expect(res.effects).toEqual(expectedEffects);
    });
});
