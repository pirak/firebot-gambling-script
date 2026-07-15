// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2
import { Rand } from '../src/helpers/rand';

export type ArgumentsOf<F extends Function> = F extends (...args: infer A) => any ? A : never;

// @ts-ignore
const randIntInclusiveOriginal = jest.spyOn(Rand, 'randIntInclusive');

export function mockExpectedRoll(value: number): void {
    // @ts-ignore
    randIntInclusiveOriginal.mockImplementationOnce(() => value);
}

export function resetRndRandIntInclusive(): void {
    randIntInclusiveOriginal.mockRestore();
}

export function replaceMessageParams(message: string, roll: number, amount: number, newTotal: number): string {
    return message
        .replace('%roll', String(roll))
        .replace('%amount', String(amount))
        .replace('%newTotal', String(newTotal));
}
