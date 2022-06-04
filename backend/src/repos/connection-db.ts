import mongoose from "mongoose";
import logger from 'jet-logger';


// Connect to Mongoose Database
mongoose.connect(`${process.env.MONGO_URI}`, {
    user: `${process.env.MONGO_USER}`,
    pass: `${process.env.MONGO_PASS}`,
    authSource: 'admin',
}).then(() => {
    logger.info(`Connected to MongoDB. URI: ${process.env.MONGO_URI}`);
}).catch((err) => {
    logger.err(`Error connecting to MongoDB. URI: ${process.env.MONGO_URI}`);
    logger.err(err);
    // Vediamo se uscire del tutto o andare avanti
});