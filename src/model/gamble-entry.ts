export class GambleEntry {
    readonly user: string;
    readonly userTotalPoints: number;
    readonly userPointsEntered: number;

    constructor(user: string, userTotalPoints: number, userPointsEntered: number) {
        this.user = user;
        this.userTotalPoints = userTotalPoints;
        this.userPointsEntered = userPointsEntered;
    }
}
