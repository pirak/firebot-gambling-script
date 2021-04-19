export enum GambleResultType {
    Won = 'Won',
    Lost = 'Lost',
    Neutral = 'Neutral',
    Jackpot = 'Jackpot',
}

export class GambleResult {
    readonly type: GambleResultType;
    readonly roll: number;
    readonly amount: number;

    constructor(type: GambleResultType, roll: number, amount: number = 0) {
        this.type = type;
        this.roll = Math.round(roll);

        if (type === GambleResultType.Neutral || type === GambleResultType.Jackpot) {
            this.amount = 0;
        } else {
            this.amount = Math.floor(amount);
        }
    }

    public toString(): string {
        return `GambleResult { type: ${this.type}, roll: ${this.roll}, amount: ${this.amount} }`;
    }
}
