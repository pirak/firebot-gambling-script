import { GambleEntry } from './model/gamble-entry';
import { Effect, LeveledLogMethod } from 'firebot-custom-scripts-types';
import { GambleMode } from './model/gamble-mode';
import { GambleResult, GambleResultType } from './model/gamble-result';
import { ChatMessageEffect } from './helpers/effects/chat-message-effect';
import { CurrencyEffect, CurrencyAction } from './helpers/effects/currency-effect';
import { UpdateCounterEffect, UpdateCounterEffectMode } from './helpers/effects/update-counter-effect';
import { Params } from './gamble-effect';

type Logger = {
    debug: LeveledLogMethod;
    info: LeveledLogMethod;
    warn: LeveledLogMethod;
    error: LeveledLogMethod;
};

export class GambleHandler {
    private readonly gamblingMode: GambleMode;
    private readonly minimumEntry: number;
    private readonly jackpotPercent: number;
    private readonly jackpotEnabled: boolean;
    private readonly logger: Logger;

    constructor(mode: GambleMode, logger: Logger, minimumEntry: number, jackpotPercent: number) {
        this.gamblingMode = mode;
        this.logger = logger;
        this.minimumEntry = Math.floor(minimumEntry);

        if (jackpotPercent <= 0) {
            this.jackpotPercent = 0;
            this.jackpotEnabled = false;
        } else {
            this.jackpotPercent = jackpotPercent / 100;
            this.jackpotEnabled = true;
        }
    }

    handle(params: Params, entry: GambleEntry): Effect[] {
        const gambleResult = this.gamblingMode.winnings(entry.userPointsEntered, this.jackpotEnabled);
        this.logger.info(`${gambleResult}`);
        return this.gambleResultEffects(params, entry.user, gambleResult);
    }

    /**
     * Generate the list of effects resulting from the given gamble result.
     * @param params parameters of the call to the script that contains more information about the user.
     * @param username the username of the user who gambled.
     * @param result the gamble result.
     * @private
     */
    private gambleResultEffects(params: Params, username: string, result: GambleResult): Effect[] {
        const effects: Effect[] = [];

        if (result.type === GambleResultType.Won) {
            const pointsAdd = new CurrencyEffect(params.currencyId, CurrencyAction.Add, username, result.amount);
            effects.push(pointsAdd);

            const message = GambleHandler.replaceMessagePlaceholders(params, result, params.messageWon);
            effects.push(new ChatMessageEffect(message));
        } else if (result.type === GambleResultType.Neutral) {
            // no need to give user points or update jackpot, just print result to chat
            const message = GambleHandler.replaceMessagePlaceholders(params, result, params.messageWon);
            effects.push(new ChatMessageEffect(message));
        } else if (result.type === GambleResultType.Lost) {
            const pointsRemove = new CurrencyEffect(params.currencyId, CurrencyAction.Remove, username, result.amount);
            effects.push(pointsRemove);

            const jackpotAddAmount = Math.floor(result.amount * this.jackpotPercent);
            if (jackpotAddAmount > 0) {
                const addToJackpot = new UpdateCounterEffect(
                    params.jackpotCounterId,
                    UpdateCounterEffectMode.Increment,
                    jackpotAddAmount,
                );
                effects.push(addToJackpot);
            }

            const message = GambleHandler.replaceMessagePlaceholders(params, result, params.messageLost);
            effects.push(new ChatMessageEffect(message));
        } else if (result.type === GambleResultType.Jackpot) {
            const pointsAdd = new CurrencyEffect(
                params.currencyId,
                CurrencyAction.Add,
                username,
                Number(params.currentJackpotAmount),
            );
            effects.push(pointsAdd);

            const resetJackpot = new UpdateCounterEffect(params.jackpotCounterId, UpdateCounterEffectMode.Set, 0);
            effects.push(resetJackpot);

            const message = GambleHandler.replaceMessagePlaceholders(params, result, params.messageJackpotWon);
            effects.push(new ChatMessageEffect(message));
        } else {
            this.logger.error('Unknown GambleResultType. Expected one of: Won, Lost, Neutral, or Jackpot.');
        }

        return effects;
    }

    /**
     * Replaces predefined placeholders in the message by their concrete value.
     *
     * Placeholders:
     * - `%roll`
     * - `%amount`
     * - `%newTotal`
     *
     * @param params parameters of the call to the script that contains more information about the user.
     * @param gambleResult of which the information should be included in the message.
     * @param message in which the placeholders should be replaced.
     * @private
     */
    private static replaceMessagePlaceholders(params: Params, gambleResult: GambleResult, message: string): string {
        message = message.replace('%roll', String(gambleResult.roll));

        const amount =
            gambleResult.type === GambleResultType.Jackpot ? Number(params.currentJackpotAmount) : gambleResult.amount;
        message = message.replace('%amount', String(amount));

        const sign =
            gambleResult.type === GambleResultType.Won || gambleResult.type === GambleResultType.Jackpot ? 1.0 : -1.0;
        const newTotal = Number(params.userCurrentPoints) + amount * sign;
        message = message.replace('%newTotal', String(newTotal));

        return message;
    }
}
