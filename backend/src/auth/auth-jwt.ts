import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { Service } from "@services/service";
import logger from "jet-logger";

export interface CustomRequest extends Request {
  token?: string;
  user?: string;
  user_id?: string;
}

function getLogger(msg: string){
  return ((req : CustomRequest, res: Response, next: NextFunction) => {
    logger.info(msg);
    next();
  });
}

function checkHeader(req: CustomRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        next();
    }else{
        let err = new Error("no auth header");
        next(err);
    }
};

function checkToken(req: CustomRequest, res: Response, next: NextFunction) {
  const bearerHeader = req.headers.authorization;
  if(typeof bearerHeader!=='undefined'){
      const bearerToken = bearerHeader.split(' ')[1];
      req.token=bearerToken;
      next();
  }else{
      res.sendStatus(403);
  }
}

function verifyToken(req: CustomRequest, res: Response, next: NextFunction) {
  let decoded = jwt.verify(`${req.token}`, `${process.env.JWT_SECRET}`);
  if(decoded !== null)
    req.user = JSON.stringify(decoded);
    next();
}

function authenticate(req: CustomRequest, res: Response, next: NextFunction) {
  const decoded_user = JSON.parse(`${req.user}`);
  Service.getInstance().authenticate(decoded_user)
  .then((user_id) => {
    req.user_id = user_id;
    next();
  })
  .catch((err : Error) => {
    next(err);
  });
  return null;
}

function checkRole(req: CustomRequest, res: Response, next: NextFunction) {
  Service.getInstance().checkAdmin(`${req.user_id}`)
    .then((check) => check ? next() : res.sendStatus(403));
}

function logErrors(err: Error, req: CustomRequest, res: Response, next: NextFunction) {
    logger.err(err.stack);
    next(err);
  }

function errorHandler(err: Error, req: CustomRequest, res: Response, next: NextFunction) {
    res.status(500).send({"error": err.message});
}

export default {
  getLogger,
  checkHeader,
  checkToken,
  verifyToken,
  authenticate,
  checkRole,
  logErrors,
  errorHandler
};