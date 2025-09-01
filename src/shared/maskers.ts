import { DataElementEnum } from "./enums";

export const fallbackMaskers: Record<DataElementEnum, (val: string) => string> =
  {
    [DataElementEnum.SSN]: (val) => val.replace(/^\d{5}/, "***-**"),
    [DataElementEnum.ACCOUNT_NUMBER]: (val) => val.replace(/\d(?=\d{4})/g, "*"),
    [DataElementEnum.PHONE]: (val) => val.replace(/.(?=.{4})/g, "*"),
    [DataElementEnum.EMAIL]: (val) => {
      const [user, domain] = val.split("@");
      return `${"*".repeat(user.length)}@${domain}`;
    },
  };
