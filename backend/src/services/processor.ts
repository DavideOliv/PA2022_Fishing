import { isIPoint } from "@models/point-model";
import { ISession, isISession } from "@models/session-model";
import axios, {AxiosResponse} from "axios";

/**
 * @interface IProcessor
 * @description Interface for processors.
 * 
 * @method process - specify how to process job data.
 * @method calculatePrice - specify how to calculate job price.
 */
export interface IProcessor{
    process(job_data: any): Promise<void>;
    calculatePrice(job_data: any): number;
    validate(job_data: any): boolean;
}

/**
 * @class SessionJobProcessor
 * @description Processor implementation for SessionJob.
 */
export class SessionJobProcessor implements IProcessor{
    /**
     * Call python service to process job data
     * @param job_info - job data.
     * @returns {Promise<any>} - promise that resolves when Python service returns a result.
     */
    async process(job_info: ISession): Promise<any> {
        return axios.post(`${process.env.PYTHON_URI}/getPrediction`, job_info)
            .then((response: AxiosResponse) => 
                Promise.resolve(response.data.pred_points))
            .catch((error: any) => 
                Promise.reject(error));
    }

    /**
     * Calculate job price.
     * Firt 100 points cost 0.005 tokens, next points cost 0.006 tokens.
     * @param job_info - job data.
     * @returns {number} - job price.
     */
    calculatePrice(job_info: ISession): number {
        return (job_info.n_pred > 100) ? (job_info.n_pred - 100) * 0.006 + 0.5 : job_info.n_pred * 0.005;
    }

    /**
     * Validate job data.
     * @param job_info - job data.
     * @returns {boolean} - true if job data is valid, false otherwise.
     */
    validate(job_info: any): boolean {
        return isISession(job_info)
            && job_info.given_points.length > 1
            && job_info.given_points.every((item:any) => isIPoint(item));
    }
}