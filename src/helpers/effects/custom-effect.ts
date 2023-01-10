// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2
import { ScriptParams } from '../../main';
import { RunRequest } from 'firebot-custom-scripts-types';

export interface CustomEffect {
    execute(runRequest: RunRequest<ScriptParams>): Promise<void>;
}
