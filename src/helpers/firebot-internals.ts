import { ScriptModules } from 'firebot-custom-scripts-types';

export type Counter = {
    id: string;
    name: string;
    saveToTxtFile: boolean;
    value: number;
};

/**
 * Temporary helper class until the module definition is merged into firebot-custom-script-types.
 */
export class CurrencyAccess {
    /**
     * Get the current amount of currency the given user has.
     * @param modules       the parameters with which the script was called.
     * @param username      the name of the user.
     * @param currencyId    the id (not name) of the currency that should be retrieved.
     */
    public static getUserCurrency(modules: ScriptModules, username: string, currencyId: string): number | undefined {
        return (modules as any).currencyDb.getUserCurrencyAmount(username, currencyId);
    }
}

/**
 * Temporary helper class until the module definition is merged into firebot-custom-script-types.
 */
export class CounterAccess {
    /**
     * Get a counter with the given name.
     * @param modules       the parameters with which the script was called.
     * @param counterName   the human-readable name of the counter.
     */
    public static getCounterByName(modules: ScriptModules, counterName: string): Counter | undefined {
        return (modules as any).counterManager.getCounterByName(counterName);
    }

    /**
     * Get a counter with the given id.
     * @param modules       the parameters with which the script was called.
     * @param counterId     the uuid of the counter.
     */
    public static getCounterById(modules: ScriptModules, counterId: string): Counter | undefined {
        return (modules as any).counterManager.getCounter(counterId);
    }
}
