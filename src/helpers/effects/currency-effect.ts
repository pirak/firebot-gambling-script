import { Effect, Firebot, RunRequest } from 'firebot-custom-scripts-types';
import { CustomEffect } from './custom-effect';
import { ScriptParams } from '../../main';
import KnownEffectType = Firebot.KnownEffectType;

export enum CurrencyAction {
    Add = 'Add',
    Remove = 'Remove',
    Set = 'Set',
}

export enum CurrencyEffectTarget {
    Individual = 'individual',
}

/**
 * Wrapper for an effect that updates the currency of a user.
 *
 * Firebot supports updating the currency of multiple users at once, but that is
 * currently not implemented.
 */
export class CurrencyEffect implements Effect, CustomEffect {
    readonly type: KnownEffectType = 'firebot:currency';

    readonly currency: string;
    readonly action: CurrencyAction;
    readonly target: CurrencyEffectTarget = CurrencyEffectTarget.Individual;
    readonly userTarget: string;
    readonly amount: number;

    /**
     * Create a new effect.
     * @param currencyName the name of the currency to use.
     * @param action in which way the currency should be altered.
     * @param username the user of which the current points should be changed.
     * @param amount the amount by which the currency should be changed.
     */
    constructor(currencyName: string, action: CurrencyAction, username: string, amount: number) {
        this.currency = currencyName;
        this.action = action;
        this.userTarget = username;
        this.amount = amount;
    }

    toString(): string {
        return `CurrencyEffect { currency: ${this.currency}, action: ${this.action}, userTarget: ${this.userTarget}, amount: ${this.amount} }`;
    }

    async execute(runRequest: RunRequest<ScriptParams>): Promise<void> {
        const amount = this.action === CurrencyAction.Remove ? -1 * this.amount : this.amount;
        const action = this.action === CurrencyAction.Set ? 'set' : 'adjust';

        await (runRequest.modules as any).currencyDb.adjustCurrencyForUser(
            this.userTarget,
            this.currency,
            amount,
            action,
        );
    }

    // eslint-disable-next-line no-undef
    [x: string]: unknown;
}
