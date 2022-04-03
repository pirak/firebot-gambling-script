// SPDX-FileCopyrightText: 2023 Firebot Gambling Script Contributors
//
// SPDX-License-Identifier: EUPL-1.2
export class NumRange {
    readonly from: number;
    readonly to: number;

    constructor(from: number, to: number) {
        this.from = Math.min(from, to);
        this.to = Math.max(from, to);
    }

    /**
     * Checks if the given number is contained in this range.
     * @param n Some number.
     */
    public contains(n: number): boolean {
        return this.from <= n && n <= this.to;
    }

    /**
     * Checks if the other range overlaps this range.
     * @param other Some other range.
     */
    public overlaps(other: NumRange): boolean {
        return this.from <= other.to && this.to >= other.from;
    }

    /**
     * Checks if the other range is fully included in this range.
     * @param other Some other range.
     */
    public includes(other: NumRange): boolean {
        return this.from <= other.from && this.to >= other.to;
    }

    /**
     * Compares the ranges for sorting by lower bound in ascending order.
     * @param other Some other range.
     */
    public compareTo(other: NumRange): number {
        const lower = this.from - other.from;
        if (lower != 0) {
            return lower;
        } else {
            return this.to - other.to;
        }
    }
}
