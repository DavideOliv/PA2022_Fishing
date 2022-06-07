import { SessionJobInfo } from "@models/session-job";
import { Service } from "@services/service";

export enum Role {
    USER,
    ADMIN
};

export enum Status {
    PENDING,
    RUNNING,
    DONE,
    FAILED
};

export const JobTypes =  {
    SESSION: SessionJobInfo,
}

type Keys = keyof typeof JobTypes;
export type JobInfoTypes = typeof JobTypes[Keys];
export type JobInstanceType<T> = T extends new () => infer R ? R : never;
