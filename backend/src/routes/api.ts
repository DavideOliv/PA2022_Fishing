import { Service } from '@services/service';
import { Router } from 'express';
import { Types } from 'mongoose';

const service = new Service();


// Export the base-router
const apiRouter = Router();

// Routes
apiRouter.get("/", (req, res) => res.send("test apiRouter"));

apiRouter.post("/newJob", (req, res) => 
    service.newJobRequest(new Types.ObjectId(`${req.query.id}`), req.body)
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

apiRouter.get("/getUserCredit/:id", (req, res) =>
    service.getUserCredit(req.params.id)
    .then((credit) => res.json(credit))
);

apiRouter.get("/getStatistics/:id", (req, res) =>
    service.getStatistics(req.params.id)
    .then((statistic) => res.json(statistic))
);

apiRouter.get("/chargeCredit/:id", (req, res) =>{
    console.log(req.params.id);
    return service.chargeCredit(Number(req.query.amount), req.params.id)
    .then((credit) => res.json(credit))
}
);

// Export default.
export default apiRouter;
