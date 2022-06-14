import { ISession } from "@models/session-model";
import axios, {AxiosResponse} from "axios";

/**
 * @interface IProcessor
 * @description Interface for processor.
 * 
 * @method process - specify how to process job data.
 * @method calculatePrice - specify how to calculate job price.
 */
export interface IProcessor{
    process(job_data: any): Promise<void>;
    calculatePrice(job_data: any): number;
}

/**
 * @class SessionJobProcessor
 * @description Processor implementation for SessionJob.
 */
export class SessionJobProcessor implements IProcessor{
    /**
     * @param job_info - job data.
     * @returns {Promise<any>} - promise that resolves when Python service returns a result.
     */
    async process(job_info: ISession): Promise<any> {
        return axios.post("http://python:5001/getPrediction", job_info)
            .then((response: AxiosResponse) => 
                Promise.resolve(response.data.pred_points))
            .catch((error: any) => 
                Promise.reject(error));
    }

    /**
     * 
     * @param job_info - job data.
     * @returns {number} - job price. Firt 100 points cost ????????
     */
    calculatePrice(job_info: ISession): number {
        return (job_info.n_pred > 100) ? (job_info.n_pred - 100) * 0.006 + 0.5 : job_info.n_pred * 0.005;
    }
}