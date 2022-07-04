// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2
import { CustomScriptManifest, DefaultParametersConfig, Firebot, RunRequest } from 'firebot-custom-scripts-types';
import { FrontendCommunicator } from 'firebot-custom-scripts-types/types/modules/frontend-communicator';

import { buildGambleEffect } from './gamble-effect';

const scriptVersion = '1.0.1';

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

    private static setupFrontendListeners(frontendCommunicator: FrontendCommunicator): void {
        console.log('Registering event: ' + EventNames.VALIDATE_INPUT);
        frontendCommunicator.onAsync<any, Array<string>>(EventNames.VALIDATE_INPUT, validateRanges);
    }

    public run(runRequest: RunRequest<ScriptParams>): void {
        runRequest.modules.logger.info('Registering Gambling Effect...');
        runRequest.modules.effectManager.registerEffect(buildGambleEffect(runRequest));
        GamblingScript.setupFrontendListeners(runRequest.modules.frontendCommunicator);
    }
}

export async function validateRanges(ranges: Array<Range>): Promise<string[]> {
    console.log(ranges);
    // ToDo: actual validation when the event is actually triggered
    return Promise.resolve(['some err from backend']);
}

export default new GamblingScript();
