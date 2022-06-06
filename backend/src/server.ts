import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';

import express, { NextFunction, Request, Response } from 'express';
import StatusCodes from 'http-status-codes';
import 'express-async-errors';

import apiRouter from './routes/api';
import logger from 'jet-logger';
import { CustomError } from '@shared/errors';
import '@repos/connection-db';

//per debug repository
import { MongoRepository } from '@repos/repo';
import { IUser, User } from '@models/user-model';



// Constants
const app = express();


/***********************************************************************************
 *                                  Middlewares
 **********************************************************************************/

// Common middlewares
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

// Show routes called in console during development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Security (helmet recommended in express docs)
if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
}


/***********************************************************************************
 *                         API routes and error handling
 **********************************************************************************/

// Add api router
 app.use('/api', apiRouter);


app.get("/test", (req: Request, res: Response) => {res.send("test")});

// Error handling
app.use((err: Error | CustomError, _: Request, res: Response, __: NextFunction) => {
    logger.err(err, true);
    const status = (err instanceof CustomError ? err.HttpStatus : StatusCodes.BAD_REQUEST);
    return res.status(status).json({
        error: err.message,
    });
});


// Export here and start in a diff file (for testing).
export default app;


app.get("/provaRepo", (req: Request, res: Response) => {
    const test = new MongoRepository<IUser>(User);
    test.getAll().then( item => res.json(item));
});

/*
app.get("/provaBull", async (req: Request, res: Response) => {
    addJob({status:Status.PENDING, price:10}, "ciaomama").then( item : any => res.json(item));
});
*/

