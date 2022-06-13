import { Service } from '@services/service';
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

apiRouter.get("/getStatistics", (req: CustomRequest, res) => // Get Jobs statistics
    service.getStatistics(`${req.user_id}`)
    .then((statistic) => res.json(statistic))
);

apiRouter.get("/chargeCredit/:id", (req, res) =>            // Charge user credit, ADMIN only
    service.chargeCredit(Number(req.query.amount), req.params.id)
    .then((credit) => res.json(credit))
);

// Export default.
export default apiRouter;
