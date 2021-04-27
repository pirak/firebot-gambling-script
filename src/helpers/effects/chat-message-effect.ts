import { Effect, Firebot, RunRequest } from 'firebot-custom-scripts-types';
import { CustomEffect } from './custom-effect';
import { ScriptParams } from '../../main';

export class ChatMessageEffect implements Effect, CustomEffect {
    readonly type: Firebot.KnownEffectType = 'firebot:chat';

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
