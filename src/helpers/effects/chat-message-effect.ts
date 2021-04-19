import { Effect, Firebot } from 'firebot-custom-scripts-types';

export class ChatMessageEffect implements Effect {
    readonly type: Firebot.KnownEffectType = 'firebot:chat';

    readonly message: string;

    constructor(message: string) {
        this.message = message;
    }

    toString(): string {
        return `ChatMessageEffect { message: ${this.message} }`;
    }

    // eslint-disable-next-line no-undef
    [x: string]: unknown;
}
