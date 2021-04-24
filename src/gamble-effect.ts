import { Effect, EffectCategory, Firebot, LeveledLogMethod, RunRequest, Trigger } from 'firebot-custom-scripts-types';
import { ScriptParams } from './main';
import { ChatMessageEffect } from './helpers/effects/chat-message-effect';
import { GambleEntry } from './model/gamble-entry';
import { GambleHandler } from './gamble-handler';
import { GambleModePercentage } from './model/gamble-mode-percentage';
import { run } from 'jest';

export interface Params {
    currencyId: string;
    userCurrentPoints: string;
    jackpotCounterId: string;
    currentJackpotAmount: string;
    minimumEntry: number;
    jackpotPercent: number;

    messageJackpotWon: string;
    messageWon: string;
    messageLost: string;

    messageEntryBelowMinimum: string;
}

interface Logger {
    debug: LeveledLogMethod;
    info: LeveledLogMethod;
    warn: LeveledLogMethod;
    error: LeveledLogMethod;
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
        jackpotPercent: 100,
        userCurrentPoints: '$currency[points, $user]',

        messageJackpotWon: 'Rolled %roll. $user won the jackpot of %amount points and now has a total of %newTotal.',
        messageLost: 'Rolled %roll. $user lost %amount points and now has a total of %newTotal.',
        messageWon: 'Rolled %roll. $user won %amount points and now has a total of %newTotal.',

        messageEntryBelowMinimum: '@$user You cannot gamble fewer than %min points.',
    };
}

interface Counter {
    id: string;
    name: string;
    value: number;
}

type Scope = {
    effect: Params;
    [x: string]: any;
};

export function buildGambleEffect(runRequest: RunRequest<ScriptParams>) {
    const gambleEffect: Firebot.EffectType<Params> = {
        definition: {
            id: 'pirak:gambling',
            name: 'Custom Gambling',
            description: 'Enables users to gamble currency via chat commands',
            icon: 'fad fa-dice',
            categories: ['fun', 'chat based'] as EffectCategory[],
            triggers: {
                command: true,
            },
            dependencies: [],
        },

        optionsTemplate: `
            <eos-container header="Currency">
              <div class="btn-group">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  <span class="currency-name">{{effect.currencyId ? getCurrencyName(effect.currencyId) : 'Pick one'}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu currency-name-dropdown">
                  <li ng-repeat="currency in currencies" ng-click="effect.currencyId = currency.id">
                    <a href>{{getCurrencyName(currency.id)}}</a>
                  </li>
                </ul>
              </div>
            </eos-container>
            <eos-container header="Jackpot Counter">
              <div class="btn-group">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  <span class="counter-name">{{effect.jackpotCounterId ? getCounterName(effect.jackpotCounterId) : 'Pick one'}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu counter-name-dropdown">
                  <li ng-repeat="counter in counters" ng-click="effect.jackpotCounterId = counter.id">
                    <a href>{{getCounterName(counter.id)}}</a>
                  </li>
                </ul>
              </div>
            </eos-container>
            <eos-container header="Gamble Mode">
              <div class="btn-group">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  <span class="gamble-mode">{{effect.mode ? effect.mode : 'Pick one'}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu mode-name-dropdown">
                  <li ng-repeat="mode in modes" ng-click="effect.mode = mode">
                    <a href>{{mode}}</a>
                  </li>
                </ul>
              </div>
            </eos-container>
        `,

        optionsController: ($scope: Scope, backendCommunicator: any, $q: any, currencyService: any) => {
            $scope.counters = [];
            $scope.currencies = [];
            $scope.modes = ['Percentage Linear', 'Threshold'];

            $scope.loadCounters = () => {
                $q.when(backendCommunicator.fireEventAsync('get-counters')).then((counters: Counter[]) => {
                    if (counters) {
                        $scope.counters = counters;
                    }
                });
            };

            $scope.currencies = currencyService.getCurrencies();

            $scope.getCounterName = (id: string) => {
                for (const counter of $scope.counters) {
                    if (counter.id === id) {
                        return counter.name;
                    }
                }
                return null;
            };

            $scope.getCurrencyName = (id: string) => {
                for (const currency of $scope.currencies) {
                    if (currency.id === id) {
                        return currency.name;
                    }
                }
                return null;
            };

            $scope.loadCounters();
        },

        optionsValidator: (effect: Params): string[] => {
            const errors = [];

            if (!effect.jackpotCounterId) {
                errors.push('Jackpot Counter not set!');
            }
            if (!effect.currencyId) {
                errors.push('Currency is not set!');
            }

            return errors;
        },

        onTriggerEvent: async (event: { effect: Params; trigger: Trigger }) => {
            runRequest.modules.logger.info('Counter ID: ' + event.effect.jackpotCounterId);

            event.effect.currentJackpotAmount = '200';
            event.effect.userCurrentPoints = '2000';
            event.effect.minimumEntry = 100;
            event.effect.jackpotPercent = 100;
            event.effect.messageEntryBelowMinimum = defaultParams().messageEntryBelowMinimum;
            event.effect.messageJackpotWon = defaultParams().messageJackpotWon;
            event.effect.messageLost = defaultParams().messageLost;
            event.effect.messageWon = defaultParams().messageWon;

            const gambleHandler = new GambleHandler(new GambleModePercentage(), runRequest.modules.logger, 0, 100);
            const effects = handle(runRequest.modules.logger, event, gambleHandler);

            runRequest.modules.logger.info('' + effects);

            // does not work, why?
            return (runRequest.modules.frontendCommunicator as any)
                .fireEventAsync('getAllEffectDefinitions', null)
                .then((effectDefs: any) => {
                    runRequest.modules.logger.info('Effect Definitions: ' + effectDefs);

                    for (const effect of effects) {
                        const effectDef = effectDefs.find(
                            (e: { definition: { id: any } }) => e.definition.id === effect.id,
                        );
                        if (effectDef) {
                            effectDef.onTriggerEvent({ effect: effect, trigger: event.trigger });
                        }
                    }
                })
                .then(() => true);
        },
    };

    return gambleEffect;
}

function handle(logger: Logger, event: { effect: Params; trigger: Trigger }, gambleHandler: GambleHandler): Effect[] {
    if (event.trigger.type !== 'command') {
        logger.debug('Not triggered by a chat command, doing nothing.');
        return [];
    }

    const commandArgs = event.trigger.metadata.userCommand?.args;
    if (commandArgs === undefined || commandArgs.length === 0 || commandArgs.length > 1) {
        logger.info('Invalid number of arguments to gambling command.');
        return [];
    }

    const username = event.trigger.metadata.username;
    const userTotalPoints = Number(event.effect.userCurrentPoints);

    const userEnteredPoints = enteredPoints(userTotalPoints, commandArgs[0]);
    if (userEnteredPoints === undefined) {
        logger.info(`Invalid format of argument to gambling command: ${commandArgs[0]}`);
        return [];
    }

    if (userEnteredPoints > Number(event.effect.userCurrentPoints)) {
        return [];
    } else if (userEnteredPoints < event.effect.minimumEntry) {
        logger.debug(event.effect.messageEntryBelowMinimum);
        const message = event.effect.messageEntryBelowMinimum.replace('%min', String(event.effect.minimumEntry));
        return [new ChatMessageEffect(message)];
    }

    const gambleEntry = new GambleEntry(username, userTotalPoints, userEnteredPoints!);
    return gambleHandler.handle(event.effect, gambleEntry);
}

/**
 * Parse the amount of points a user gambles from the command argument.
 * @param userTotalPoints the total amount of points a user has, needed for percentage entry.
 * @param commandArg the command argument.
 * @private
 */
function enteredPoints(userTotalPoints: number, commandArg: string): number | undefined {
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
