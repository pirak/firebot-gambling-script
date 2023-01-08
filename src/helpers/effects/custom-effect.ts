import { ScriptParams } from '../../main';
import { RunRequest } from 'firebot-custom-scripts-types';

export interface CustomEffect {
    execute(runRequest: RunRequest<ScriptParams>): Promise<void>;
}
