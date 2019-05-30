import reduce from 'lodash/reduce';
import trimStart from 'lodash/trimStart';
import trimEnd from 'lodash/trimEnd';

const getMeal = (locals) => {
  const reducedResult = reduce(locals, (result, v) => `${result}, ${v}`, ``);
  const trimResult1 = trimStart(reducedResult, ', ');
  const result = `${trimEnd(trimResult1, ' ,')}입니다. 😂`;

  return result;
};

export default getMeal;
