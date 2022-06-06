import { IPoint } from "./point-model";
import { ISession } from "./session-model";
import { IJobInfo } from "./job-model";

export class SessionJobInfo implements IJobInfo, ISession {
    session_id: string;
    vessel_id: string;
    n_pred: number;
    given_points: IPoint[];
    pred_points?: IPoint[] | undefined;

    constructor(session: ISession) {
        this.session_id = session.session_id;
        this.vessel_id = session.vessel_id;
        this.n_pred = session.n_pred;
        this.given_points = session.given_points;
        this.pred_points = session.pred_points;
    }

    process() {
        // TODO: process session
    }
    calculatePrice(): number {
        return (this.n_pred > 100) ? (this.n_pred - 100) * 0.006 + 0.5 : this.n_pred * 0.005;
    }
}