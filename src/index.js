import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import router from './routers/index.js';
import notFoundHandler from './errors/notFoundHandler.js';
import errorHandler from './errors/errorHandle.js';
const app = express();

// middleware
app.use(express.json());
app.use(morgan('tiny'));
app.use(express.urlencoded({ extended: true }));
// connect db
connectDB('mongodb://localhost:27017/bittis');

// routers
app.use('/api', router);

// health check
app.get('/ping', (req, res) => {
    res.send('pong!');
});

app.use(notFoundHandler);
app.use(errorHandler);
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
