import { IStats, Service } from '@services/service';
import { Router } from 'express';
import authJwt, {CustomRequest} from 'src/auth/auth-jwt';


const service = Service.getInstance();


// Export the base-router
const apiRouter = Router();

apiRouter.use(authJwt.getLogger("start"));               // Log start of request: Debugging purposes
apiRouter.use(authJwt.checkHeader);                      // Check if the request has authentication header
apiRouter.use(authJwt.checkToken);                       // Check if the request contains Bearer token
apiRouter.use(authJwt.verifyToken);                      // Verify if the token is valid
apiRouter.use(authJwt.getLogger("token verified"));      // Log token verification: Debugging purposes
apiRouter.use(authJwt.authenticate);                     // Authenticate the user
apiRouter.use(authJwt.getLogger("authenticated"));       // Log user authentication: Debugging purposes
apiRouter.use("/chargeCredit",authJwt.checkRole);        // Check if the user has the right role
apiRouter.use(authJwt.logErrors);                        // Log errors
apiRouter.use(authJwt.errorHandler);                     // Handle errors

// Routes
apiRouter.get("/", (req: CustomRequest, res) =>          // Api Router test
    res.send("test auth apiRouter"));

apiRouter.post("/newJob", (req: CustomRequest, res) =>   // Create a new job
    service.newJobRequest(`${req.user_id}`, req.body)
    .then((jobId) => res.json({id: jobId}))
);

apiRouter.get("/getJobStatus/:id", (req, res) =>         // Get job status
    service.getJobStatus(req.params.id)
    .then((jobInfo) => res.json(jobInfo))
);

apiRouter.get("/getJobInfo/:id", (req, res) => 
    service.getJobInfo(req.params.id)
    .then((item) => res.json(item))
);

apiRouter.get("/getUserCredit", (req: CustomRequest, res) => // Get user credit
    service.getUserCredit(`${req.user_id}`)
    .then((credit) => res.json(credit))
);

apiRouter.get("/getStatistics", async (req: CustomRequest, res) => {
    const t_process: IStats = await service.getStatistics(`${req.user_id}`, (job) => job.end.valueOf() - job.start.valueOf());
    const t_coda: IStats = await service.getStatistics(`${req.user_id}`, (job) => job.start.valueOf() - job.submit.valueOf());
    const t_tot: IStats = await service.getStatistics(`${req.user_id}`, (job) => job.end.valueOf() - job.submit.valueOf());
    res.json({
        process_time_stats: t_process,
        queue_time_stats: t_coda,
        tot_time_stats: t_tot
    });
});

apiRouter.get("/chargeCredit", (req, res) => {
    if(Number(req.query.amount) < 0) res.json({error: "amount must be positive"});
    service.chargeCredit(Number(req.query.amount), `${req.query.user_email}`)
    .then((credit) => res.json(credit))
    .catch(err => res.send(err.toString()))
});

// Export default.
export default apiRouter;
