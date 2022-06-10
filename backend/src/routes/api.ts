import { IStats, Service } from '@services/service';
import { Router } from 'express';
import authJwt, {CustomRequest} from 'src/auth/auth-jwt';


const service = Service.getInstance();


// Export the base-router
const apiRouter = Router();

apiRouter.use(authJwt.getLogger("start"));
apiRouter.use(authJwt.checkHeader);
apiRouter.use(authJwt.checkToken);
apiRouter.use(authJwt.verifyToken);
apiRouter.use(authJwt.getLogger("token verified"));
apiRouter.use(authJwt.authenticate);
apiRouter.use(authJwt.getLogger("authenticated"));
apiRouter.use("/chargeCredit",authJwt.checkRole);
apiRouter.use(authJwt.logErrors);
apiRouter.use(authJwt.errorHandler);

// Routes
apiRouter.get("/", (req: CustomRequest, res) => res.send("test auth apiRouter"));

apiRouter.post("/newJob", (req: CustomRequest, res) => 
    service.newJobRequest(`${req.user_id}`, req.body)
    .then((jobId) => res.json({id: jobId}))
);

apiRouter.get("/getJobStatus/:id", (req, res) => 
    service.getJobStatus(req.params.id)
    .then((jobInfo) => res.json(jobInfo))
);

apiRouter.get("/getJobInfo/:id", (req, res) => 
    service.getJobInfo(req.params.id)
    .then((item) => res.json(item))
);

apiRouter.get("/getUserCredit", (req: CustomRequest, res) =>
    service.getUserCredit(`${req.user_id}`)
    .then((credit) => res.json(credit))
);

apiRouter.get("/getStatistics", async (req: CustomRequest, res) => {
    const t_process: IStats = await service.getStatistics(`${req.user_id}`, (job) => job.end.valueOf() - job.start.valueOf());
    const t_coda: IStats = await service.getStatistics(`${req.user_id}`, (job) => job.start.valueOf() - job.submit.valueOf());
    res.json({
        time_process: t_process,
        time_coda: t_coda
    });
});

apiRouter.get("/chargeCredit/:id", (req, res) =>
    service.chargeCredit(Number(req.query.amount), req.params.id)
    .then((credit) => res.json(credit))
    .catch(err => res.send(err.toString()))
);

// Export default.
export default apiRouter;
