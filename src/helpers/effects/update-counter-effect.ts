import { ScriptParams } from '../../main';
import { CustomEffect } from './custom-effect';
import { RunRequest } from 'firebot-custom-scripts-types';
import { Effects } from 'firebot-custom-scripts-types/types/effects';

import Effect = Effects.Effect;
import KnownEffectType = Effects.KnownEffectType;

export enum UpdateCounterEffectMode {
    Increment = 'increment',
    Set = 'set',
}

export class UpdateCounterEffect implements Effect, CustomEffect {
    readonly type: KnownEffectType = 'firebot:update-counter';

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

    async execute(runRequest: RunRequest<ScriptParams>): Promise<void> {
        const override = this.mode === UpdateCounterEffectMode.Set;
        await runRequest.modules.counterManager.updateCounterValue(this.counterId, this.value, override);
    }

    // eslint-disable-next-line no-undef
    [x: string]: unknown;
}
