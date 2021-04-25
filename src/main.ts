import {
    CustomScriptManifest,
    DefaultParametersConfig,
    Effect,
    Firebot,
    RunRequest,
    ScriptReturnObject,
} from 'firebot-custom-scripts-types';
import { GambleHandler } from './gamble-handler';
import { GambleModePercentage } from './model/gamble-mode-percentage';
import { GambleEntry } from './model/gamble-entry';
import { ChatMessageEffect } from './helpers/effects/chat-message-effect';
import { CounterAccess, CurrencyAccess } from './helpers/firebot-internals';

const scriptVersion = '0.1.3';

export interface Params {
    currency: string;
    jackpotCounter: string;
    minimumEntry: number;
    jackpotPercent: number;

    messageJackpotWon: string;
    messageWon: string;
    messageLost: string;

    messageEntryBelowMinimum: string;
}

enum Result {
    Ok,
    Err,
}

/**
 * Default values for the parameters.
 * Placeholders starting with `$` are replaced by Firebot when calling the
 * script, the ones with `%` are replaced in the script.
 */
export function defaultParams(): Params {
    return {
        currency: 'Points',
        jackpotCounter: 'Jackpot',
        minimumEntry: 100,
        jackpotPercent: 100,

        messageJackpotWon: 'Rolled %roll. $user won the jackpot of %amount points and now has a total of %newTotal.',
        messageLost: 'Rolled %roll. $user lost %amount points and now has a total of %newTotal.',
        messageWon: 'Rolled %roll. $user won %amount points and now has a total of %newTotal.',

        messageEntryBelowMinimum: '@$user You cannot gamble fewer than %min points.',
    };
}

export class GamblingScript implements Firebot.CustomScript<Params> {
    private gambleHandler: GambleHandler | undefined;

    public getDefaultParameters(): DefaultParametersConfig<Params> {
        const params = defaultParams();

        return {
            currency: {
                type: 'string',
                default: params.currency,
                description: 'Name of the Currency',
                secondaryDescription: 'The name of the currency that should be gambled.',
            },
            jackpotCounter: {
                type: 'string',
                default: params.jackpotCounter,
                description: 'Name of the Jackpot Counter',
                secondaryDescription: 'Create a custom counter where the current jackpot value should be stored.',
            },
            minimumEntry: {
                type: 'number',
                default: params.minimumEntry,
                description: 'Minimum Entry',
                secondaryDescription: 'The minimum amount of points users can gamble.',
            },
            jackpotPercent: {
                type: 'number',
                default: params.jackpotPercent,
                description: 'Jackpot Percent',
                secondaryDescription:
                    'Defines which percentage of the lost points should go into the jackpot. Should be >= 0. Values < 0 will be used as 0 and disables the jackpot. E.g. ‘50’ means that 50% of the lost points are added to the jackpot.',
            },
            messageJackpotWon: {
                type: 'string',
                default: params.messageJackpotWon,
                description: 'Message on Jackpot Won',
                secondaryDescription: 'The message sent in chat when a user wins the jackpot.',
            },
            messageLost: {
                type: 'string',
                default: params.messageLost,
                description: 'Message on Lost',
                secondaryDescription: 'The message sent in chat when a user loses points.',
            },
            messageWon: {
                type: 'string',
                default: params.messageWon,
                description: 'Message on Won',
                secondaryDescription: 'The message sent in chat when a user wins points.',
            },
            messageEntryBelowMinimum: {
                type: 'string',
                default: params.messageEntryBelowMinimum,
                description: 'Message on Entry Too Few Points',
                secondaryDescription:
                    'The message sent in chat when a user tries to enter with less than minimum points.',
            },
        };
    }

    public getScriptManifest(): CustomScriptManifest {
        return {
            name: 'Firebot Gambling Script',
            description: 'A script that lets chat users gamble currency',
            author: 'pirak__',
            version: scriptVersion,
            firebotVersion: '5',
        };
    }

    public run(runRequest: RunRequest<Params>): Promise<ScriptReturnObject> {
        const { logger } = runRequest.modules;
        const result: ScriptReturnObject = {
            effects: [],
            success: true,
        };

        if (this.gambleHandler === undefined) {
            this.gambleHandler = new GambleHandler(
                new GambleModePercentage(),
                logger,
                runRequest.parameters.minimumEntry,
                runRequest.parameters.jackpotPercent,
            );
        }

        result.effects = this.handle(runRequest);
        logger.info(`${result.effects}`);

        return new Promise((resolve) => resolve(result));
    }

    private handle(runRequest: RunRequest<Params>): Effect[] {
        const { logger } = runRequest.modules;

        if (GamblingScript.validateParams(runRequest) === Result.Err) {
            return [];
        }

        const commandArgs = runRequest.trigger.metadata.userCommand?.args;
        const username = runRequest.trigger.metadata.username;
        const currency = runRequest.parameters.currency;
        const userTotalPoints = CurrencyAccess.getUserCurrency(runRequest, username, currency)!;

        const userEnteredPoints = GamblingScript.enteredPoints(userTotalPoints, commandArgs![0]);
        if (userEnteredPoints === undefined) {
            logger.info(`Invalid format of argument to gambling command: ${commandArgs![0]}`);
            return [];
        }

        if (userEnteredPoints > userTotalPoints) {
            return [];
        } else if (userEnteredPoints < runRequest.parameters.minimumEntry) {
            logger.debug(runRequest.parameters.messageEntryBelowMinimum);
            const message = runRequest.parameters.messageEntryBelowMinimum.replace(
                '%min',
                String(runRequest.parameters.minimumEntry),
            );
            return [new ChatMessageEffect(message)];
        }

        const gambleEntry = new GambleEntry(username, userTotalPoints, userEnteredPoints!);
        const jackpotValue = CounterAccess.getCounterById(runRequest, runRequest.parameters.jackpotCounter)!.value;

        return this.gambleHandler!.handle(runRequest.parameters, gambleEntry, jackpotValue);
    }

    private static validateParams(runRequest: RunRequest<Params>): Result {
        const { logger } = runRequest.modules;

        if (runRequest.trigger.type !== 'command') {
            logger.debug('Trigger is not a command, ignoring...');
            return Result.Err;
        }

        const commandArgs = runRequest.trigger.metadata.userCommand?.args;
        if (commandArgs === undefined || commandArgs.length === 0 || commandArgs.length > 1) {
            logger.info('Invalid number of arguments to gambling command.');
            return Result.Err;
        }

        const currency = CurrencyAccess.getCurrencyByName(runRequest, runRequest.parameters.currency);
        if (!currency) {
            logger.error('Currency with name ' + runRequest.parameters.currency + ' could not be found!');
            return Result.Err;
        }
        runRequest.parameters.currency = currency.id;

        const jackpot = CounterAccess.getCounterByName(runRequest, runRequest.parameters.jackpotCounter.toLowerCase());
        if (!jackpot) {
            logger.error('Counter with name ' + runRequest.parameters.jackpotCounter + ' could not be found!');
            return Result.Err;
        }
        runRequest.parameters.jackpotCounter = jackpot.id;

        return Result.Ok;
    }

    /**
     * Parse the amount of points a user gambles from the command argument.
     * @param userTotalPoints the total amount of points a user has, needed for percentage entry.
     * @param commandArg the command argument.
     * @private
     */
    private static enteredPoints(userTotalPoints: number, commandArg: string): number | undefined {
        if (commandArg === 'all') {
            return userTotalPoints;
        } else if (commandArg.match(/^(100|\d{2}|[1-9])%$/)) {
            const percent = parseInt(commandArg.replace('%', '')) / 100.0;
            return Math.floor(userTotalPoints * percent);
        } else if (commandArg.match(/^\d+$/)) {
            const enteredPoints = parseInt(commandArg);
            if (!isNaN(enteredPoints) && enteredPoints > 0) {
                return enteredPoints;
            }
        }
    }
}

export default new GamblingScript();
