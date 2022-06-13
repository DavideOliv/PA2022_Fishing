import { ISession } from "@models/session-model";
import axios, {AxiosResponse} from 'axios';

export interface IProcessor{
    process(job_data: any): Promise<void>;
    calculatePrice(job_data: any): number;
}

export class SessionJobProcessor implements IProcessor{
    async process(job_info: ISession): Promise<void> {
        // console.log("Processing job...");
        // job_info.pred_points = [...job_info.given_points].reverse();
        // return Promise.resolve();
        return axios.post("http://python:5001/getPrediction", job_info)
            .then((response: AxiosResponse) => {
                job_info.pred_points = response.data;
                return Promise.resolve();
            })
            .catch((error: any) => {
                console.log(error);
                return Promise.reject(error);
            });
    }
    calculatePrice(job_info: ISession): number {
        return (job_info.n_pred > 100) ? (job_info.n_pred - 100) * 0.006 + 0.5 : job_info.n_pred * 0.005;
    }
}