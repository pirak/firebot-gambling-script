import { ScriptModules } from 'firebot-custom-scripts-types';

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
    public static async getUserCurrency(
        modules: ScriptModules,
        username: string,
        currencyId: string,
    ): Promise<number | undefined> {
        return Promise.resolve((modules as any).currencyDb.getUserCurrencyAmount(username, currencyId));
    }
}
