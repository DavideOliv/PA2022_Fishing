import { IStats, Service } from '@services/service';
import { Router } from 'express';
import logger from 'jet-logger';
import authJwt, {CustomRequest} from 'src/auth/auth-jwt';


/**
 * Instantiate a Service Singleton
 * Export the base-router
 */
const service = Service.getInstance();
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

/**
 * Api route for test authentication
 */
apiRouter.get("/", (req: CustomRequest, res) =>          
    res.send("test auth apiRouter"));

/**
 * Api route to create a new job
 */
apiRouter.post("/newJob", (req: CustomRequest, res) =>  
    service.newJobRequest(`${req.user_id}`, req.body)
        .then((jobId) => res.json({id: jobId}))
        .catch((err) => res.status(401).json(err)) // Not enough credits
);

/**
 * Api route to get the status of a job 
 * (PENDING, PROCESSING, DONE, FAILED)
 */
apiRouter.get("/getJobStatus/:id", (req, res) =>         
    service.getJobStatus(req.params.id)
        .then((jobInfo) => res.json(jobInfo))
        .then((item) => res.json(item))
        .catch((err) => res.status(400).json(err)) // Job not found
);

/**
 * Api route to get all information about a job
 * return a json with the predictions only if the job is "done"
 */
apiRouter.get("/getJobInfo/:id", (req, res) => 
    service.getJobInfo(req.params.id)
        .then((item) => res.json(item))
        .catch((err) => res.status(400).json(err)) // Job not found
);

/**
 * Api route to get the remaining credits of the user
 */
apiRouter.get("/getUserCredit", (req: CustomRequest, res) => // Get user credit
    service.getUserCredit(`${req.user_id}`)
        .then((credit) => res.json(credit))
        .catch((err) => res.status(400).json(err)) // User not found
);

/**
 * Api route to get the stats of the jobs of the user
 */
apiRouter.get("/getStatistics", async (req: CustomRequest, res) => {
    try {
        const t_process: IStats = await service.getStatistics(`${req.user_id}`, (job) => job.end.valueOf() - job.start.valueOf());
        const t_coda: IStats = await service.getStatistics(`${req.user_id}`, (job) => job.start.valueOf() - job.submit.valueOf());
        const t_tot: IStats = await service.getStatistics(`${req.user_id}`, (job) => job.end.valueOf() - job.submit.valueOf());
        res.json({
            process_time_stats: t_process,
            queue_time_stats: t_coda,
            tot_time_stats: t_tot
        });
    } catch (err) {
        logger.err(err)
        res.status(400).json(err);
    }
});

/**
 * Api route to charge the user credit
 */
apiRouter.get("/chargeCredit", (req, res) => {
    if(Number(req.query.amount) < 0) res.status(400).json({error: "amount must be positive"});
    service.chargeCredit(Number(req.query.amount), `${req.query.user_email}`)
        .then((credit) => res.json(credit))
        .catch(err => res.status(400).json(err)) // User not found
});


export default apiRouter;
