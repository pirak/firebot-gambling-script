// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2

export class Rand {
    /**
     * Generates a random integer in range [min, max] inclusive.
     * @param min lower bound >= 0 inclusive.
     * @param max upper bound >= 0 inclusive.
     * @returns a random integer in range [min, max] inclusive.
     * @private
     */
    static randIntInclusive(min: number, max: number): number {
        const diff = Math.abs(max - min);
        // Node crypto module for proper randomness is not available in Firebot
        return Math.floor(Math.random() * (diff + 1)) + min;
    }
}
