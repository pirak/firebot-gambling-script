// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2
import { Firebot, RunRequest, ScriptModules } from 'firebot-custom-scripts-types';
import { Effects } from 'firebot-custom-scripts-types/types/effects';
import { Currency } from 'firebot-custom-scripts-types/types/modules/currency-db';
import { Logger } from 'firebot-custom-scripts-types/types/modules/logger';

import { GambleHandler } from './gamble-handler';
import { ChatMessageEffect } from './helpers/effects/chat-message-effect';
import { CustomEffect } from './helpers/effects/custom-effect';
import { ScriptParams } from './main';
import { GambleEntry } from './model/gamble-entry';
import { GambleModePercentage } from './model/gamble-mode-percentage';
import { GambleModeRanges } from './model/gamble-mode-ranges';
import { GambleModeThreshold } from './model/gamble-mode-threshold';
import { WinRange } from './model/win-range';
import EffectCategory = Effects.EffectCategory;
import Trigger = Effects.Trigger;

type ThresholdOptions = {
    maxRoll: number;
    threshold: number;
    jackpotTarget: number;
    winPointsFactor: number;
};

export interface Params {
    currencyId: string;
    jackpotCounterId: string;
    minimumEntry: number;
    jackpotPercent: number;

    messageJackpotWon: string;
    messageWon: string;
    messageLost: string;
    messageEntryBelowMinimum: string;

    mode: string;

    thresholdOptions: ThresholdOptions;

    ranges: Array<Range>;
    rangeErrors: Array<string>;
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
        currencyId: '7b9ac050-a096-11eb-9ce3-69b33571b547',
        jackpotCounterId: '71dd1e86-178d-491d-8f61-9c5851faf8a8',
        minimumEntry: 100,
        jackpotPercent: 100,

        messageJackpotWon: 'Rolled %roll. $user won the jackpot of %amount points and now has a total of %newTotal.',
        messageLost: 'Rolled %roll. $user lost %amount points and now has a total of %newTotal.',
        messageWon: 'Rolled %roll. $user won %amount points and now has a total of %newTotal.',
        messageEntryBelowMinimum: '@$user You cannot gamble fewer than %min points.',

        mode: 'Percentage Linear',

        thresholdOptions: {
            maxRoll: 100,
            threshold: 50,
            jackpotTarget: 100,
            winPointsFactor: 1,
        },

        ranges: [
            { from: 0, to: 49, mult: -1, rangeType: 'Normal' },
            { from: 50, to: 50, mult: 0, rangeType: 'Normal' },
            { from: 51, to: 99, mult: 1, rangeType: 'Normal' },
            { from: 100, to: 100, rangeType: 'Jackpot' },
        ],
        rangeErrors: [],
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

export function buildGambleEffect(runRequest: RunRequest<ScriptParams>): Firebot.EffectType<Params> {
    return {
        definition: {
            id: 'pirak:gambling',
            name: 'Custom Gambling',
            description: 'Enables users to gamble currency via chat commands',
            icon: 'fad fa-dice',
            categories: ['fun', 'chat based'] as EffectCategory[],
            triggers: {
                command: true,
            },
            dependencies: ['chat'],
        },

        optionsTemplate: optionsTemplate,

        optionsController: (
            $scope: Scope,
            $q: any,
            backendCommunicator: any,
            currencyService: any,
            countersService: any,
        ) => {
            $scope.counters = countersService.counters ?? ([] as Array<Counter>);
            $scope.currencies = currencyService.getCurrencies() ?? ([] as Array<Currency>);
            $scope.modes = ['Percentage Linear', 'Threshold', 'Ranges'];
            $scope.rangeTypes = ['Normal', 'Jackpot'];

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

            const eff = $scope.effect;
            const def = defaultParams();
            eff.minimumEntry ??= def.minimumEntry;
            eff.jackpotPercent ??= def.jackpotPercent;
            eff.messageJackpotWon ??= def.messageJackpotWon;
            eff.messageLost ??= def.messageLost;
            eff.messageWon ??= def.messageWon;
            eff.messageEntryBelowMinimum ??= def.messageEntryBelowMinimum;
            eff.thresholdOptions ??= def.thresholdOptions;
            eff.ranges ??= def.ranges;

            $scope.numRanges = eff.ranges.length;
            $scope.numRangesChange = () => {
                if ($scope.numRanges > eff.ranges.length) {
                    eff.ranges.push({ from: 0, to: 0, mult: 1, rangeType: 'Normal' });
                } else if ($scope.numRanges < eff.ranges.length) {
                    eff.ranges.pop();
                }
            };

            $scope.validateRangesOptions = () => {
                if ($scope.effect.mode !== 'Ranges') {
                    $scope.rangeErrors = [];
                } else {
                    $q.when(
                        backendCommunicator.fireEventAsync(
                            'pirak-custom-gambling-validate-input',
                            $scope.effect.ranges,
                        ),
                    ).then((errors: string[]) => {
                        $scope.rangeErrors = errors;
                        $scope.effect.rangeErrors = errors;
                    });
                }
            };
        },

        optionsValidator: (effect: Params): string[] => {
            const errors = [];

            errors.push(...effect.rangeErrors);

            if (!effect.jackpotCounterId) {
                errors.push('Jackpot Counter not set!');
            }
            if (!effect.currencyId) {
                errors.push('Currency is not set!');
            }
            if (!effect.mode) {
                errors.push('Please select a gambling mode!');
            }

            return errors;
        },

        onTriggerEvent: async (event: { effect: Params; trigger: Trigger }) => {
            let gambleMode;
            switch (event.effect.mode) {
                case 'Threshold':
                    gambleMode = new GambleModeThreshold(event.effect.thresholdOptions);
                    break;
                case 'Ranges':
                    const ranges = event.effect.ranges.map((range) => WinRange.fromRange(range));
                    gambleMode = <GambleModeRanges>GambleModeRanges.build(ranges);
                    break;
                case 'Percentage Linear':
                default:
                    gambleMode = new GambleModePercentage();
            }

            const gambleHandler = new GambleHandler(
                gambleMode,
                runRequest.modules.logger,
                event.effect.minimumEntry,
                event.effect.jackpotPercent,
            );
            const effects = await handle(runRequest.modules, event, gambleHandler);
            return Promise.all(effects.map((e) => e.execute(runRequest))).then(() => true);
        },
    };
}

export type Range = {
    from: number;
    to: number;
    mult?: number;
    rangeType: string;
};

export async function handle(
    scriptModules: ScriptModules,
    event: { effect: Params; trigger: Trigger },
    gambleHandler: GambleHandler,
): Promise<CustomEffect[]> {
    const logger = scriptModules.logger;

    if (validateTrigger(logger, event.trigger) === Result.Err) {
        return [];
    }

    // validateTrigger ensures args are defined and have the needed length
    const commandArgs: string[] = event.trigger.metadata.userCommand?.args!;
    const username = event.trigger.metadata.username;
    const currency = event.effect.currencyId;
    const userTotalPoints = await scriptModules.currencyDb.getUserCurrencyAmount(username, currency);
    if (userTotalPoints === undefined) {
        logger.error(`Cannot retrieve currency with ID ${currency} for user ${username}!`);
        return [];
    }

    const userEnteredPoints = enteredPoints(userTotalPoints, commandArgs[0]);
    if (userEnteredPoints === undefined) {
        logger.info(`Invalid format of argument to gambling command: ${commandArgs[0]}`);
        return [];
    }

    if (userEnteredPoints > userTotalPoints) {
        return [];
    } else if (userEnteredPoints < event.effect.minimumEntry) {
        logger.debug(event.effect.messageEntryBelowMinimum);
        const message = event.effect.messageEntryBelowMinimum.replace('%min', String(event.effect.minimumEntry));
        return [new ChatMessageEffect(message)];
    }

    const gambleEntry = new GambleEntry(username, userTotalPoints, userEnteredPoints);
    const jackpotValue = scriptModules.counterManager.getCounter(event.effect.jackpotCounterId)!.value;
    scriptModules.logger.info('Jackpot Value: ' + jackpotValue);
    return gambleHandler.handle(event.effect, gambleEntry, jackpotValue);
}

export function validateTrigger(logger: Logger, trigger: Trigger): Result {
    if (trigger.type !== 'command') {
        logger.debug('Trigger is not a command, ignoring...');
        return Result.Err;
    }

    const commandArgs = trigger.metadata.userCommand?.args;
    if (commandArgs === undefined || commandArgs.length === 0 || commandArgs.length > 1) {
        logger.info('Invalid number of arguments to gambling command.');
        return Result.Err;
    }

    return Result.Ok;
}

/**
 * Parse the amount of points a user gambles from the command argument.
 * @param userTotalPoints the total amount of points a user has, needed for percentage entry.
 * @param commandArg the command argument.
 * @private
 */
export function enteredPoints(userTotalPoints: number, commandArg: string): number | undefined {
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

const optionsTemplate = `
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
    <eos-container header="Common Parameters">
        <div class="input-group">
            <span class="input-group-addon" id="minimum-entry-type">Minimum Amount</span>
            <input type="number" min="0" step="1" ng-model="effect.minimumEntry" class="form-control" id="minimum-entry-setting">
        </div>
        <div class="input-group" style="margin-top: 4px">
            <span class="input-group-addon" id="jackpot-percent-type">Jackpot Percent</span>
            <input type="number" min="0" step="1" ng-model="effect.jackpotPercent" class="form-control" id="jackpot-percent-setting">
        </div>
    </eos-container>
    <eos-container header="Messages">
        <div class="input-group">
            <span class="input-group-addon" id="message-won-type">Won</span>
            <textarea ng-model="effect.messageWon" class="form-control" name="text" rows="2" replace-variables menu-position="under"></textarea>
        </div>
        <div class="input-group" style="margin-top: 4px">
            <span class="input-group-addon" id="message-jackpot-won-type">Jackpot Won</span>
            <textarea ng-model="effect.messageJackpotWon" class="form-control" name="text" rows="2" replace-variables menu-position="under"></textarea>
        </div>
        <div class="input-group" style="margin-top: 4px">
            <span class="input-group-addon" id="message-lost-type">Lost</span>
            <textarea ng-model="effect.messageLost" class="form-control" name="text" rows="2" replace-variables menu-position="under"></textarea>
        </div>
        <div class="input-group" style="margin-top: 4px">
            <span class="input-group-addon" id="message-below-min-type">Entry Below Minimum</span>
            <textarea ng-model="effect.messageEntryBelowMinimum" class="form-control" name="text" rows="2" replace-variables menu-position="under"></textarea>
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
        <div ng-if="effect.mode === 'Threshold'">
            <div class="input-group" style="margin-top: 4px">
                <span class="input-group-addon">Maximum Roll (inclusive)</span>
                <input type="number" min="0" step="1" ng-model="effect.thresholdOptions.maxRoll" class="form-control">
            </div>
            <div class="input-group" style="margin-top: 4px">
                <span class="input-group-addon">Threshold Win/Lose</span>
                <input type="number" min="0" step="1" ng-model="effect.thresholdOptions.threshold" class="form-control">
            </div>
            <div class="input-group" style="margin-top: 4px">
                <span class="input-group-addon">Jackpot Target Roll</span>
                <input type="number" min="0" step="1" ng-model="effect.thresholdOptions.jackpotTarget" class="form-control">
            </div>
            <div class="input-group" style="margin-top: 4px">
                <span class="input-group-addon">Won Points Multiplicator</span>
                <input type="number" min="0" step="1" ng-model="effect.thresholdOptions.winPointsFactor" class="form-control">
            </div>
        </div>
        <div ng-if="effect.mode === 'Ranges'">
            <div class="input-group" style="margin-top: 4px;">
                <span class="input-group-addon">Number of Ranges</span>
                <input type="number" min="1" step="1" class="form-control" ng-model="numRanges" ng-change="numRangesChange()">
            </div>
            <table class="fb-table">
                <tr>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Multiplier</th>
                </tr>
                <tr ng-repeat="range in effect.ranges">
                    <td>
                        <ui-select ng-model="range.rangeType" theme="bootstrap" style="width: 8em;">
                            <ui-select-match placeholder="Mode…">{{ range.rangeType }}</ui-select-match>
                            <ui-select-choices repeat="rangeType in rangeTypes" style="position:relative;">
                                <span>{{ rangeType }}</span>
                            </ui-select-choices>
                        </ui-select>
                    </td>
                    <td><input class="form-control" type="number" min="0" step="1" style="width: 7em;" ng-model="range.from" ng-change="validateRangesOptions()"></td>
                    <td><input class="form-control" type="number" min="0" step="1" style="width: 7em;" ng-model="range.to" ng-change="validateRangesOptions()"></td>
                    <td><input class="form-control" type="number" style="width: 7em;" ng-disabled="range.rangeType === 'Jackpot'" ng-model="range.mult" ng-change="validateRangesOptions()"></td>
                </tr>
            </table>
            <div>
                <ul>
                    <li ng-repeat="err in rangeErrors">
                        <span>{{ err }}</span>
                    </li>
                </ul>
            </div>
        </div>
    </eos-container>
`;
