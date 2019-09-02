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
import size from 'lodash/size';

import morgan from 'morgan';
import moment from 'moment';
import 'moment-timezone';

import getMeal from './getMeal';
import constants from './constants';
import getDateAndMeal from './getDateAndMeal';

moment.tz.setDefault("Asia/Seoul");

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
  const { sys_date } = req.body.action.detailParams;
  const sysDate = sys_date.origin;
  const date = getDateAndMeal.getDate(sysDate);
  const url = constants.CATHOLIC_MENU;

  const options = {
    method: 'get',
    url,
    params: {
      years: moment().get('year'),
      months: moment().get('month') + 1,
      days: date
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

router.post('/getEntireMeal', async (req, res) => {
  const { locals } = res;
  const { custom_meal } = req.body.action.detailParams;
  const customMeal = custom_meal.origin;
  const meal = getDateAndMeal.getMeal(customMeal);
  const result = getMeal(locals[meal]);

  const response = {
    data: {
      msg: size(locals) === 0 ? '영양사 선생님이 아직 학식을 올려주시지 않았어요. :)' : result,
    },
  };

  res.json(response);
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
