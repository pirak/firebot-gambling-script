import { Effect, Firebot } from 'firebot-custom-scripts-types';
import KnownEffectType = Firebot.KnownEffectType;

export enum UpdateCounterEffectMode {
    Increment = 'increment',
    Set = 'set',
}

export class UpdateCounterEffect implements Effect {
    // @ts-ignore
    readonly type: KnownEffectType = 'firebot:update-counter' as KnownEffectType;

    readonly counterId: string;
    readonly mode: UpdateCounterEffectMode;
    readonly value: number;

    constructor(counterId: string, mode: UpdateCounterEffectMode, value: number) {
        this.counterId = counterId;
        this.mode = mode;
        this.value = value;
    }

    toString(): string {
        return `UpdateCounterEffect { counterId: ${this.counterId}, mode: ${this.mode}, value: ${this.value} }`;
    }

    // eslint-disable-next-line no-undef
    [x: string]: unknown;
}
