// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2
import { CustomScriptManifest, DefaultParametersConfig, Firebot, RunRequest } from 'firebot-custom-scripts-types';

import { buildGambleEffect } from './gamble-effect';

const scriptVersion = '1.0.1';

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

    public run(runRequest: RunRequest<ScriptParams>): void {
        runRequest.modules.logger.info('Registering Gambling Effect...');
        runRequest.modules.effectManager.registerEffect(buildGambleEffect(runRequest));
    }
}

export default new GamblingScript();
