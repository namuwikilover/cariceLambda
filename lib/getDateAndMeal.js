import moment from 'moment';

const getDate = (sysDate) => {
  if (sysDate === '오늘') {
    return moment().get('date');
  } else if (sysDate === '내일') {
    return moment().get('date') + 1;
  } else if (sysDate === '모레') {
    return moment().get('date') + 2;
  } else if (sysDate === '월요일') {
    return moment().day(1).get('date');
  } else if (sysDate === '화요일') {
    return moment().day(2).get('date');
  } else if (sysDate === '수요일') {
    return moment().day(3).get('date');
  } else if (sysDate === '목요일') {
    return moment().day(4).get('date');
  } else if (sysDate === '금요일') {
    return moment().day(5).get('date');
  } else if (sysDate === '토요일') {
    return moment().day(6).get('date');
  } else if (sysDate === '일요일') {
    return moment().day(0).get('date');
  }
};

const getMeal = (customMeal) => {
  if (customMeal === '아침') {
    return 0;
  } else if (customMeal === '점심') {
    return 1;
  } else if (customMeal === '저녁') {
    return 2;
  } else if (customMeal === '야식') {
    return 3;
  }
};

export default {
  getDate,
  getMeal,
};