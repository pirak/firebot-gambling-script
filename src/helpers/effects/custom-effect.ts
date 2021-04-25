import { RunRequest } from 'firebot-custom-scripts-types';
import { ScriptParams } from '../../main';

export interface CustomEffect {
    execute(runRequest: RunRequest<ScriptParams>): Promise<void>;
}
