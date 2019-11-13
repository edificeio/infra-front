import { removeDiacritics } from "./diacritics";

export class StrUtils
{
  static removeDiacritics: (str: string) => string = removeDiacritics;
};