'use strict';
import express from 'express';
import routes from '../routes.js';
import { home, getSerialPort, postSerialPort, getRadioInfo, getPage4 } from '../controllers/globalController.js';

const globalRouter = express.Router();


/* GET home page. */
globalRouter.get(routes.home, home);
globalRouter.get(routes.serialPort, getSerialPort);
globalRouter.post(routes.serialPort, postSerialPort);
globalRouter.get(routes.radioInfo, getRadioInfo);
globalRouter.get('/page_4', getPage4);


export default globalRouter;
