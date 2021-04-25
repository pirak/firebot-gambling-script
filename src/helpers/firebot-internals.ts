import { RunRequest } from 'firebot-custom-scripts-types';
import { Params } from '../main';

export type Currency = {
    id: string;
    name: string;
    active: boolean;
    limit: number;
    transfer: 'Allow' | 'Disallow';
    interval: number;
    payout: number;
    /** Offline payout */
    offline: number;
    bonus: Record<string, number>;
};

export type Counter = {
    id: string;
    name: string;
    saveToTxtFile: boolean;
    value: number;
};

export class CurrencyAccess {
    /**
     * Get the id of the currency with the given name.
     * @param runRequest    the parameters with which the script was called.
     * @param currencyName  the human-readable name of the currency.
     */
    public static getCurrencyByName(runRequest: RunRequest<Params>, currencyName: string): Currency | undefined {
        return (runRequest.modules as any).currencyDb
            .getCurrencies()
            .find((c: Currency) => c.name.toLowerCase() === currencyName.toLowerCase());
    }

    /**
     * Get the current amount of currency the given user has.
     * @param runRequest    the parameters with which the script was called.
     * @param username      the name of the user.
     * @param currencyId    the id (not name) of the currency that should be retrieved.
     */
    public static getUserCurrency(
        runRequest: RunRequest<Params>,
        username: string,
        currencyId: string,
    ): number | undefined {
        return (runRequest.modules as any).currencyDb.getUserCurrencyAmount(username, currencyId);
    }
}

export class CounterAccess {
    /**
     * Get a counter with the given name.
     * @param runRequest    the parameters with which the script was called.
     * @param counterName   the human-readable name of the counter.
     */
    public static getCounterByName(runRequest: RunRequest<Params>, counterName: string): Counter | undefined {
        return (runRequest.modules as any).counterManager.getCounterByName(counterName);
    }

    /**
     * Get a counter with the given id.
     * @param runRequest    the parameters with which the script was called.
     * @param counterId     the uuid of the counter.
     */
    public static getCounterById(runRequest: RunRequest<Params>, counterId: string): Counter | undefined {
        return (runRequest.modules as any).counterManager.getCounter(counterId);
    }
}
