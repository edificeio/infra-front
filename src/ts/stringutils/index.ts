import { removeDiacritics } from "./diacritics";

export class StrUtils
{
  static removeDiacritics: (str: string) => string = removeDiacritics;
};

if(!(window as any).entcore){
	(window as any).entcore = {};
}
(window as any).entcore.StrUtils = StrUtils;