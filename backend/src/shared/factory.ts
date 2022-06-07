import { IJobInfo } from "@models/job-model";
import { SessionJobInfo } from "@models/session-job";
import { JobInfoTypes, JobTypes } from "./enums";

export class JobInfoFactory {
    constructor() { }
    getJob(type: JobInfoTypes, data: any): IJobInfo {
        switch (type) {
            case JobTypes.SESSION:
                return new SessionJobInfo(data);
            default:
                throw new Error("Job type not found");
        }
    }
}