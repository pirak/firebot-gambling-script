// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2

export class Rand {
    /**
     * Generates a random integer in range [0, max] inclusive.
     * @param max upper bound inclusive.
     * @returns a random integer in range [0, max] inclusive.
     * @private
     */
    static randIntInclusive(max: number): number {
        // Node crypto module for proper randomness is not available in Firebot
        return Math.floor(Math.random() * (max + 1));
    }
}
