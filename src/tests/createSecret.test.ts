import {expect, test} from '@jest/globals';
import createRandomString from '../modules/createRandomString';

test('Return secret', () => {
  expect(createRandomString(20)).toHaveLength(20)
})