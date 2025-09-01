import { maskPatternRegistry, applyPattern, getPatternByLevel, builtInPatterns, enhancedPatterns, type MaskPattern } from "./maskPatterns";
import { DataElementEnum } from "./enums";

describe("MaskPatterns", () => {
  describe("Pattern Registry", () => {
    test("registers and retrieves patterns", () => {
      const customPattern: MaskPattern = {
        id: "TEST_PATTERN",
        name: "Test Pattern",
        description: "Test pattern for unit tests",
        level: "PARTIAL_LAST4",
        apply: (value: string) => "TEST_" + value,
      };

      maskPatternRegistry.register(customPattern);
      const retrieved = maskPatternRegistry.get("TEST_PATTERN");
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe("TEST_PATTERN");
      expect(retrieved?.apply("test")).toBe("TEST_test");

      maskPatternRegistry.unregister("TEST_PATTERN");
      expect(maskPatternRegistry.get("TEST_PATTERN")).toBeUndefined();
    });

    test("finds patterns by level", () => {
      const fullPattern = getPatternByLevel("FULL");
      expect(fullPattern?.id).toBe("FULL");
      
      const maskAllPattern = getPatternByLevel("MASK_ALL");
      expect(maskAllPattern?.id).toBe("MASK_ALL");
    });

    test("lists all patterns", () => {
      const patterns = maskPatternRegistry.list();
      expect(patterns.length).toBeGreaterThanOrEqual(builtInPatterns.length + enhancedPatterns.length);
    });
  });

  describe("Built-in Patterns", () => {
    test("FULL pattern returns original value", () => {
      const pattern = getPatternByLevel("FULL");
      expect(pattern?.apply("123-45-6789")).toBe("123-45-6789");
    });

    test("MASK_ALL pattern preserves SSN format", () => {
      const pattern = getPatternByLevel("MASK_ALL");
      const result = pattern?.apply("123-45-6789", { 
        dataType: DataElementEnum.SSN, 
        role: "test" 
      });
      expect(result).toBe("***-**-****");
    });

    test("PARTIAL_LAST4 pattern masks SSN correctly", () => {
      const pattern = getPatternByLevel("PARTIAL_LAST4");
      const result = pattern?.apply("123-45-6789", { 
        dataType: DataElementEnum.SSN, 
        role: "test" 
      });
      expect(result).toBe("***-**-6789");
    });

    test("PARTIAL_LAST4 pattern masks email correctly", () => {
      const pattern = getPatternByLevel("PARTIAL_LAST4");
      const result = pattern?.apply("user@example.com", { 
        dataType: DataElementEnum.EMAIL, 
        role: "test" 
      });
      expect(result).toBe("***@example.com"); // Email local part gets masked with ***
    });

    test("PARTIAL_LAST3 pattern masks SSN correctly", () => {
      const pattern = getPatternByLevel("PARTIAL_LAST3");
      const result = pattern?.apply("123-45-6789", { 
        dataType: DataElementEnum.SSN, 
        role: "test" 
      });
      expect(result).toBe("***-**-*789");
    });
  });

  describe("Enhanced Patterns", () => {
    test("CREDIT_CARD_LUHN pattern works", () => {
      const pattern = maskPatternRegistry.get("CREDIT_CARD_LUHN");
      const result = pattern?.apply("4111111111111111", { 
        dataType: DataElementEnum.CREDIT_CARD, 
        role: "test" 
      });
      expect(result).toMatch(/4\*\*\* \*\*\*\* \*\*\*\* 1111/);
    });

    test("ADDRESS_STRUCTURED pattern works", () => {
      const pattern = maskPatternRegistry.get("ADDRESS_STRUCTURED");
      const result = pattern?.apply("123 Main St, Seattle, WA 98101", { 
        dataType: DataElementEnum.ADDRESS, 
        role: "test" 
      });
      expect(result).toBe("*** Main St, Seattle, WA 98101"); // Only the street number gets masked
    });

    test("NAME_STRUCTURED pattern works", () => {
      const pattern = maskPatternRegistry.get("NAME_STRUCTURED");
      const result = pattern?.apply("John Doe", { 
        dataType: DataElementEnum.NAME, 
        role: "test" 
      });
      expect(result).toBe("**** D**");
    });

    test("DATE_PRESERVE_FORMAT pattern works for MM/DD/YYYY", () => {
      const pattern = maskPatternRegistry.get("DATE_PRESERVE_FORMAT");
      const result = pattern?.apply("03/15/1985", { 
        dataType: DataElementEnum.DATE_OF_BIRTH, 
        role: "test" 
      });
      expect(result).toBe("**/**/1985");
    });

    test("IP_ADDRESS_SUBNET pattern works for IPv4", () => {
      const pattern = maskPatternRegistry.get("IP_ADDRESS_SUBNET");
      const result = pattern?.apply("192.168.1.100", { 
        dataType: DataElementEnum.IP_ADDRESS, 
        role: "test" 
      });
      expect(result).toBe("192.168.***.**");
    });
  });

  describe("applyPattern helper", () => {
    test("applies pattern by ID", () => {
      const result = applyPattern("MASK_ALL", "test");
      expect(result).toBe("****");
    });

    test("throws error for unknown pattern", () => {
      expect(() => applyPattern("UNKNOWN_PATTERN", "test")).toThrow("Unknown mask pattern: UNKNOWN_PATTERN");
    });
  });
});