import { GambleModePercentage } from '../src/model/gamble-mode-percentage';

export type ArgumentsOf<F extends Function> = F extends (...args: infer A) => any ? A : never;

// @ts-ignore
const randIntInclusiveOriginal = jest.spyOn(GambleModePercentage, 'randIntInclusive');

export function mockExpectedRoll(value: number): void {
    // @ts-ignore
    randIntInclusiveOriginal.mockImplementationOnce(() => value);
}

export function resetRngGambleModePercentage(): void {
    randIntInclusiveOriginal.mockRestore();
}

export function replaceMessageParams(message: string, roll: number, amount: number, newTotal: number): string {
    return message
        .replace('%roll', String(roll))
        .replace('%amount', String(amount))
        .replace('%newTotal', String(newTotal));
}
