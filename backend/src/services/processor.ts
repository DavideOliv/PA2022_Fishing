import { ISession } from "@models/session-model";

export interface IProcessor{
    process(job_data: any): Promise<void>;
    calculatePrice(job_data: any): number;
}

export class SessionJobProcessor implements IProcessor{
    async process(job_info: ISession): Promise<void> {
        console.log("Processing job...");
        job_info.pred_points = [...job_info.given_points].reverse();
        return Promise.resolve();
    }
    calculatePrice(job_info: ISession): number {
        return (job_info.n_pred > 100) ? (job_info.n_pred - 100) * 0.006 + 0.5 : job_info.n_pred * 0.005;
    }
}