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

export interface Params {
    currencyId: string;
    userCurrentPoints: string;
    jackpotCounterId: string;
    currentJackpotAmount: string;
    minimumEntry: number;

    messageJackpotWon: string;
    messageWon: string;
    messageLost: string;

    messageEntryBelowMinimum: string;
}

/**
 * Default values for the parameters.
 * Placeholders starting with `$` are replaced by Firebot when calling the
 * script, the ones with `%` are replaced in the script.
 */
export function defaultParams(): Params {
    return {
        currencyId: '7b9ac050-a096-11eb-9ce3-69b33571b547',
        jackpotCounterId: '71dd1e86-178d-491d-8f61-9c5851faf8a8',
        currentJackpotAmount: '$counter[jackpot]',
        minimumEntry: 100,
        userCurrentPoints: '$currency[points, $user]',

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
            currencyId: {
                type: 'string',
                default: params.currencyId,
                description: 'Internal ID of the Currency',
                secondaryDescription:
                    'The id of the currency that should be gambled. In Settings open the root folder. There is a folder "currency" with a file "currency.json". In there find the id of the currency that should be used for gambling.',
            },
            userCurrentPoints: {
                type: 'string',
                default: params.userCurrentPoints,
                description: 'Currency Access',
                secondaryDescription:
                    'Variable to access the currency of the user who called the chat command. Replace "points" with the name of your currency.',
            },
            jackpotCounterId: {
                type: 'string',
                default: params.jackpotCounterId,
                description: 'Internal ID of the Jackpot Counter',
                secondaryDescription:
                    'Create a custom counter. In Settings open the root folder. There is a folder "counters" with the file "counters.json". In there find the counter with that name you used before and copy the value of "id" (Careful: not the ids of "maximum/minimumEffects"!).',
            },
            currentJackpotAmount: {
                type: 'string',
                default: params.currentJackpotAmount,
                description: 'The Current Jackpot Amount',
                secondaryDescription: 'Replace jackpot with your name of the custom counter used to store the jackpot',
            },
            minimumEntry: {
                type: 'number',
                default: params.minimumEntry,
                description: 'Minimum Entry',
                secondaryDescription: 'The minimum amount of points users can gamble.',
            },
            messageJackpotWon: {
                type: 'string',
                default: params.messageJackpotWon,
                description: 'Message Jackpot Won',
                secondaryDescription: 'The message sent in chat when a user wins the jackpot.',
            },
            messageLost: {
                type: 'string',
                default: params.messageLost,
                description: 'Message Lost',
                secondaryDescription: 'The message sent in chat when a user loses points.',
            },
            messageWon: {
                type: 'string',
                default: params.messageWon,
                description: 'Message Won',
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
            version: '0.1.0',
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
            );
        }

        result.effects = this.handle(runRequest);
        logger.info(`${result.effects}`);

        return new Promise((resolve) => resolve(result));
    }

    private handle(runRequest: RunRequest<Params>): Effect[] {
        const { logger } = runRequest.modules;

        if (runRequest.trigger.type !== 'command') {
            logger.debug('Trigger is not a command, ignoring...');
            return [];
        }

        const commandArgs = runRequest.trigger.metadata.userCommand?.args;
        if (commandArgs === undefined || commandArgs.length === 0 || commandArgs.length > 1) {
            logger.info('Invalid number of arguments to gambling command.');
            return [];
        }

        const username = runRequest.trigger.metadata.username;
        const userTotalPoints = Number(runRequest.parameters.userCurrentPoints);

        const userEnteredPoints = GamblingScript.enteredPoints(userTotalPoints, commandArgs[0]);
        if (userEnteredPoints === undefined) {
            logger.info(`Invalid format of argument to gambling command: ${commandArgs[0]}`);
            return [];
        }

        if (userEnteredPoints > Number(runRequest.parameters.userCurrentPoints)) {
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
        return this.gambleHandler!.handle(runRequest.parameters, gambleEntry);
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
