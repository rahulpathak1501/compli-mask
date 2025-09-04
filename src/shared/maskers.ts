import { DataElementEnum, MaskingLevel } from "./enums";

export const fallbackMaskers: Record<
  DataElementEnum,
  (val: string, pattern?: RegExp) => string
> = {
  [DataElementEnum.SSN]: (val) => val.replace(/^\d{5}/, "***-**"),
  [DataElementEnum.ACCOUNT_NUMBER]: (val) => val.replace(/\d(?=\d{4})/g, "*"),
  [DataElementEnum.PHONE]: (val) => val.replace(/.(?=.{4})/g, "*"),
  [DataElementEnum.EMAIL]: (val) => {
    const [user, domain] = val.split("@");
    return `${"*".repeat(user.length)}@${domain}`;
  },

  [DataElementEnum.CREDIT_CARD]: (val) => val.replace(/\d(?=\d{4})/g, "*"),
  [DataElementEnum.ADDRESS]: (val) => val.replace(/./g, "*"),
  [DataElementEnum.NAME]: (val) => val.replace(/./g, "*"),
  [DataElementEnum.DATE_OF_BIRTH]: (val) => val.replace(/./g, "*"),
  [DataElementEnum.IP_ADDRESS]: (val) => val.replace(/\d+/g, "*"),
  [DataElementEnum.LICENSE_PLATE]: (val) => val.replace(/./g, "*"),
  [DataElementEnum.PASSPORT_NUMBER]: (val) => val.replace(/./g, "*"),
  [DataElementEnum.IBAN]: (val) => val.replace(/./g, "*"),
  [DataElementEnum.CUSTOM]: (val, pattern) =>
    pattern ? val.replace(pattern, "*") : val,
};
