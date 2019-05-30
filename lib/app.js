/* eslint-disable quotes */
import '@babel/polyfill';

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import compression from 'compression';
import axios from 'axios';
import awsServerlessExpressMiddleware from 'aws-serverless-express/middleware';
import cheerio from 'cheerio';

import trim from 'lodash/trim';
import map from 'lodash/fp/map';
import pipe from 'lodash/fp/pipe';
import split from 'lodash/split';
import forEach from 'lodash/forEach';

import morgan from 'morgan';

import getMeal from './getMeal';

const app = express();
const router = express.Router();

if (process.env.NODE_ENV === 'test') {
  // NOTE: aws-serverless-express uses this app for its integration tests
  // and only applies compression to the /sam endpoint during testing.
  router.use('/sam', compression());
} else {
  router.use(compression());
}

router.use(morgan('combined'));
router.use(cors());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }))
router.use(awsServerlessExpressMiddleware.eventContext())

router.use(async (req, res, next) => {
  const url = 'http://songeui.catholic.ac.kr/m/foodMenu/foods1_01.jsp';

  const date = new Date();

  const dataValues = {
    years: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };

  const options = {
    method: 'get',
    url,
    params: {
      years: dataValues.years,
      months: dataValues.month,
      days: dataValues.day,
    },
  };

  const response = await axios(options);

  const $ = cheerio.load(response.data, {
    decodeEntities: false,
  });

  const parsedCheerio = [];
  const breakfast = $('table').find($('.menuList'));

  breakfast.map((index, element) => {
    const string = $(element).html();

    return parsedCheerio.push(trim(string));
  });

  const result = pipe([
    map(v => split(v, '<br>')),
    map(v => map(vv => trim(vv, '"'))(v)),
  ])(parsedCheerio);

  res.locals = result;
  next();
});

//   apiUrl: req.apiGateway ? `https://${req.apiGateway.event.headers.Host}/${req.apiGateway.event.requestContext.stage}` : 'http://localhost:3000'

const paths = ['/getBreakfast', '/getLunch', '/getDinner', '/getMidnightSnack'];

forEach(paths, (path, index) => {
  router.post(path, async (req, res) => {
    const { locals } = res;
    const result = getMeal(locals[index]);

    const response = {
      data: {
        msg: result,
      },
    };

    res.json(response);
  });
});

app.use((err, req, res, next) => {
  if (err) {
    res.status(500).send('Something broke!');
  }

  next();
});


// The aws-serverless-express library creates a server and listens on a Unix
// Domain Socket for you, so you can remove the usual call to app.listen.
// app.listen(3000)
app.use('/', router);

// Export your express server so you can import it in the lambda function.
module.exports = app;
