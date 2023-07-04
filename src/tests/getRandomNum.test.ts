import {expect, test} from '@jest/globals';
import getRandomNum from '../modules/getRandomNum';

test('Getting random number', () => {
  const randNum = getRandomNum(3,6)
  expect(randNum).toBeGreaterThanOrEqual(3)
  expect(randNum).toBeLessThanOrEqual(6)

  const randNum2 = getRandomNum(142, 1000);
  expect(randNum2).toBeGreaterThanOrEqual(142)
  expect(randNum2).toBeLessThanOrEqual(1000)
})