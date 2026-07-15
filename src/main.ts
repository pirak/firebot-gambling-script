// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2
import {
    CustomScriptManifest,
    DefaultParametersConfig,
    Firebot,
    RunRequest,
    ScriptModules,
} from 'firebot-custom-scripts-types';

import { buildGambleEffect, Range } from './gamble-effect';
import { GambleModeRanges, RangeError } from './model/gamble-mode-ranges';
import { WinRange } from './model/win-range';

const scriptVersion = '1.1.0';

export enum EventNames {
    VALIDATE_INPUT = 'pirak-custom-gambling-validate-input',
}

export interface ScriptParams extends Record<string, unknown> {}

export class GamblingScript implements Firebot.CustomScript<ScriptParams> {
    public getDefaultParameters(): DefaultParametersConfig<ScriptParams> {
        return {};
    }

    public getScriptManifest(): CustomScriptManifest {
        return {
            name: 'Firebot Gambling Script',
            description: 'A script that lets chat users gamble currency',
            author: 'pirak__',
            version: scriptVersion,
            firebotVersion: '5',
            startupOnly: true,
        };
    }

    private static setupFrontendListeners(modules: ScriptModules): void {
        console.log('Registering event: ' + EventNames.VALIDATE_INPUT);
        modules.frontendCommunicator.onAsync<any, Array<string>>(EventNames.VALIDATE_INPUT, validateRanges);
    }

    public run(runRequest: RunRequest<ScriptParams>): void {
        runRequest.modules.logger.info('Registering Gambling Effect...');
        runRequest.modules.effectManager.registerEffect(buildGambleEffect(runRequest));
        GamblingScript.setupFrontendListeners(runRequest.modules);
    }
}

export async function validateRanges(ranges: Array<Range>): Promise<string[]> {
    const errors: string[] = [];

    const winRanges = ranges.map((range) => WinRange.fromRange(range));
    switch (GambleModeRanges.build(winRanges)) {
        case RangeError.Overlap:
            errors.push('There are overlapping ranges.');
            break;
        case RangeError.NonContiguous:
            errors.push('The range has holes. E.g., if one range ends at 10, the next has to start at 11.');
            break;
        case RangeError.Negative:
            errors.push('There cannot be ranges starting on a value less than 0.');
            break;
        default:
            // no errors
            break;
    }

    return Promise.resolve(errors);
}

export default new GamblingScript();
