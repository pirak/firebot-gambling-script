import { CustomScriptManifest, DefaultParametersConfig, Firebot, RunRequest } from 'firebot-custom-scripts-types';
import { buildGambleEffect } from './gamble-effect';

const scriptVersion = '1.0.0';

export interface ScriptParams {}

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
