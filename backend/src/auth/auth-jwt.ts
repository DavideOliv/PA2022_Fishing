import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { Service } from "@services/service";
import logger from "jet-logger";

/**
 * Custom Request interface
 * @interface CustomRequest
 * @extends {Request}
 * @property {string} user_id - user id in MongoDB
 * @property {string} token - JWT token
 * @property {string} user - JSON user object decoded (contains email)
*/
export interface CustomRequest extends Request {
  token?: string;
  user?: string;
  user_id?: string;
}

/**
 * Logger middleware generator
 * returns a middleware callback function that logs a message
 * @param {string} msg - message to be logged
 * @returns {function} - middleware callback function
*/ 
function getLogger(msg: string){
  return ((req : CustomRequest, res: Response, next: NextFunction) => {
    logger.info(msg);
    next();
  });
}

/**
 * Each of the middlewares are functions
 * that take the request and the response objects,
 * and then call the next middleware function.
 */

/**
 * Check Header middleware
 * check if request contains Authorization header
*/
function checkHeader(req: CustomRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        next();
    }else{
        res.status(403).json({"error": "No authorization header"});
    }
};

/**
 * Check Token middleware
 * check if request contains JWT token
*/
function checkToken(req: CustomRequest, res: Response, next: NextFunction) {
  const bearerHeader = req.headers.authorization;
  if( bearerHeader?.toLowerCase().startsWith("bearer ") ){
      const bearerToken = bearerHeader.split(' ')[1];
      req.token=bearerToken;
      next();
  }else{
      res.status(403).json({"error": "No token provided"});
  }
}

/**
 * Verify Token middleware
 * verify JWT token using secret key stored in environment variables
*/ 
function verifyToken(req: CustomRequest, res: Response, next: NextFunction) {
  try {
    let decoded = jwt.verify(`${req.token}`, `${process.env.JWT_SECRET}`);
    if(decoded !== null)
    req.user = JSON.stringify(decoded);
    next();
  } catch (err) {
    res.status(403).json({"error": "Invalid token"});
  }
}

/**
 * Authentication middleware
 * set user_id in request using user decoded from JWT token
*/ 
function authenticate(req: CustomRequest, res: Response, next: NextFunction) {
  const decoded_user = JSON.parse(`${req.user}`);
  Service.getInstance().authenticate(decoded_user)
    .then((user_id) => {
      req.user_id = user_id;
      next();
    })
    .catch((err : Error) => {
      res.status(403).json({ "error": err.message });
    });
  return null;
}

/**
 * Check Role middleware
 * check if user has admin role
*/
function checkRole(req: CustomRequest, res: Response, next: NextFunction) {
  Service.getInstance().checkAdmin(`${req.user_id}`)
    .then((check) => check ? next() : res.status(403).json({"error": "Not authorized"}));
}

/**
 * Log Errors middleware
 * log error message
*/
function logErrors(err: Error, req: CustomRequest, res: Response, next: NextFunction) {
    logger.err(err.stack);
    next(err);
  }

/**
 * Error Handler middleware
 * handle error message
*/
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