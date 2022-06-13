import { IPoint } from "./point-model";
import { ISession } from "./session-model";

/**
 * Session job info class
 * @class
 * @implements {IJobInfo, ISession}
 * @param {string} session_id - session id
 * @param {string} vessel_id - AIS vessel id
 * @param {number} n_pred - number of forecast points
 * @param {IPoint[]} given_points - given points array
 * @param {IPoint[]} pred_points - predicted points array
*/
export class SessionJobInfo implements ISession {
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
}