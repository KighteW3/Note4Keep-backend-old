import getRandomNum from "./getRandomNum";

export default function createRandomString(length: number, special: boolean) {
  const characters = "abcdefghijklmnopqrstuvwxyz";
  const specialCharacters = ",._-'º{}/|";
  let randomString = "";

  for (let i = 0; i < length; i++) {
    const randNum = getRandomNum(0, 2);

    if (randNum === 0) {
      const randNumAlph = getRandomNum(0, characters.length - 1);
      const randNumSize = getRandomNum(0, 1);

      randNumSize > 0
        ? (randomString = randomString.concat(
            "",
            characters[randNumAlph].toUpperCase()
          ))
        : (randomString = randomString.concat("", characters[randNumAlph]));
    } else if (randNum === 1) {
      const randNumNumeric = getRandomNum(0, 9);

      randomString = randomString.concat("", randNumNumeric.toString());
    } else if (randNum === 2 && special) {
      const randNumSpec = getRandomNum(0, specialCharacters.length - 1);

      randomString = randomString.concat("", specialCharacters[randNumSpec]);
    } else {
      const randNumNumeric = getRandomNum(0, 9);
      randomString = randomString.concat("", randNumNumeric.toString());
    }
  }

  return randomString;
}
