import { ScriptParams } from '../../main';
import { CustomEffect } from './custom-effect';
import { RunRequest } from 'firebot-custom-scripts-types';
import { Effects } from 'firebot-custom-scripts-types/types/effects';

import KnownEffectType = Effects.KnownEffectType;
import Effect = Effects.Effect;

export class ChatMessageEffect implements Effect, CustomEffect {
    readonly type: KnownEffectType = 'firebot:chat';

    readonly message: string;

    constructor(message: string) {
        this.message = message;
    }

    toString(): string {
        return `ChatMessageEffect { message: ${this.message} }`;
    }

    async execute(runRequest: RunRequest<ScriptParams>): Promise<void> {
        runRequest.modules.twitchChat.sendChatMessage(this.message, undefined, 'bot');
    }

    // eslint-disable-next-line no-undef
    [x: string]: unknown;
}
