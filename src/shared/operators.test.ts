import {
  maskAll,
  partialLastN,
  emailMask,
  phoneMask,
  ssnMask,
} from "./operators";

describe("operators", () => {
  test("maskAll replaces all characters", () => {
    expect(maskAll("abcd")).toBe("****");
  });

  test("partialLastN shows last N characters", () => {
    expect(partialLastN("abcdef", 3)).toBe("***def");
    expect(partialLastN("abc", 5)).toBe("abc");
  });

  test("emailMask preserves domain", () => {
    expect(emailMask("user@domain.com")).toBe("***@domain.com");
  });

  test("phoneMask shows last 4 digits", () => {
    expect(phoneMask("123-456-7890")).toMatch(/\*\*\*-\*\*\*-7890/);
  });

  test("ssnMask masks first 5 digits", () => {
    expect(ssnMask("123-45-6789")).toBe("***-**-6789");
  });
});
