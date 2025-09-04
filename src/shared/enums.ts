export const DataElementEnum = {
  SSN: "SSN",
  ACCOUNT_NUMBER: "ACCOUNT_NUMBER",
  PHONE: "PHONE",
  EMAIL: "EMAIL",
  CREDIT_CARD: "CREDIT_CARD",
  ADDRESS: "ADDRESS",
  NAME: "NAME",
  DATE_OF_BIRTH: "DATE_OF_BIRTH",
  IP_ADDRESS: "IP_ADDRESS",
  LICENSE_PLATE: "LICENSE_PLATE",
  PASSPORT_NUMBER: "PASSPORT_NUMBER",
  IBAN: "IBAN",
  CUSTOM: "CUSTOM",
} as const;

export type DataElementEnum =
  (typeof DataElementEnum)[keyof typeof DataElementEnum];

export const MaskingLevel = {
  FULL: "FULL",
  NONE: "NONE",
  MASK_ALL: "MASK_ALL",
  PARTIAL_LAST4: "PARTIAL_LAST4",
  PARTIAL_LAST3: "PARTIAL_LAST3",
  CUSTOM_REGEX: "CUSTOM_REGEX", // new
} as const;

export type MaskingLevel = (typeof MaskingLevel)[keyof typeof MaskingLevel];
