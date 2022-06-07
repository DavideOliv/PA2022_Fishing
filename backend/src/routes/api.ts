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
    .then((jobId) => res.json({id: jobId})));

apiRouter.get("/getJobStatus/:id", (req, res) => 
    service.getJobStatus(req.params.id)
    .then((jobInfo) => res.json(jobInfo)));


// Export default.
export default apiRouter;
