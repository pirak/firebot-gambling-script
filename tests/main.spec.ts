import customScript, { defaultParams, GamblingScript } from '../src/main';
import { ArgumentsOf, replaceMessageParams, mockExpectedRoll } from './helpers';
import { RunRequest, ScriptModules } from 'firebot-custom-scripts-types';
import { CurrencyEffect, CurrencyAction } from '../src/helpers/effects/currency-effect';
import { UpdateCounterEffect, UpdateCounterEffectMode } from '../src/helpers/effects/update-counter-effect';
import { ChatMessageEffect } from '../src/helpers/effects/chat-message-effect';

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

describe('The handler', () => {
    it('should ignore runRequests that are not commands', async () => {
        const runRequest = ({
            parameters: {},
            modules: { logger: mockLogger },
            trigger: {
                type: 'manual',
            },
        } as unknown) as RunRequest<any>;

        const res = await customScript.run(runRequest);
        expect(res.effects).toEqual([]);
    });

    it('should not crash on runRequests with no userCommand', async () => {
        const runRequest = ({
            parameters: {},
            modules: { logger: mockLogger },
            trigger: {
                type: 'command',
                metadata: {
                    username: 'pirak__',
                },
            },
        } as unknown) as RunRequest<any>;

        const res = await customScript.run(runRequest);
        expect(res.effects).toEqual([]);
    });

    it('should ignore runRequests with no command arguments', async () => {
        const runRequest = ({
            parameters: {},
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

        const res = await customScript.run(runRequest);
        expect(res.effects).toEqual([]);
    });

    it('should ignore runRequests with more than one command arguments', async () => {
        const runRequest = ({
            parameters: {},
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

        const res = await customScript.run(runRequest);
        expect(res.effects).toEqual([]);
    });

    it('should ignore runRequests with one invalid argument', async () => {
        const runRequest = ({
            parameters: {},
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

        const res = await customScript.run(runRequest);
        expect(res.effects).toEqual([]);
    });

    it('should return the result of the gamble handler if the argument is valid', async () => {
        const params = defaultParams();
        params.currentJackpotAmount = '1000';
        params.userCurrentPoints = '10000';

        const runRequest = ({
            parameters: params,
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

        mockExpectedRoll(100);
        const expectedEffects = [
            new CurrencyEffect(defaultParams().currencyId, CurrencyAction.Add, 'pirak__', 1000),
            new UpdateCounterEffect(params.jackpotCounterId, UpdateCounterEffectMode.Set, 0),
            new ChatMessageEffect(replaceMessageParams(defaultParams().messageJackpotWon, 100, 1000, 10000 + 1000)),
        ];

        const res = await customScript.run(runRequest);
        expect(res.effects).toEqual(expectedEffects);
    });
});
