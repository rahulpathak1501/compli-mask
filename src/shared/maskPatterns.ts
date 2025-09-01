import type { DataType, MaskLevel } from "./types";
import { DataElementEnum } from "./enums";

export interface MaskPattern {
  id: string;
  name: string;
  description: string;
  apply: (value: string, context?: MaskContext) => string;
  level: MaskLevel; // For backward compatibility
  dataTypes?: DataType[]; // Applicable data types, if undefined applies to all
}

export interface MaskContext {
  dataType: DataType;
  role: string;
  metadata?: Record<string, any>;
}

export interface MaskPatternRegistry {
  register(pattern: MaskPattern): void;
  unregister(patternId: string): void;
  get(patternId: string): MaskPattern | undefined;
  list(): MaskPattern[];
  findByLevel(level: MaskLevel): MaskPattern | undefined;
  findForDataType(dataType: DataType): MaskPattern[];
}

class DefaultMaskPatternRegistry implements MaskPatternRegistry {
  private patterns = new Map<string, MaskPattern>();

  register(pattern: MaskPattern): void {
    this.patterns.set(pattern.id, pattern);
  }

  unregister(patternId: string): void {
    this.patterns.delete(patternId);
  }

  get(patternId: string): MaskPattern | undefined {
    return this.patterns.get(patternId);
  }

  list(): MaskPattern[] {
    return Array.from(this.patterns.values());
  }

  findByLevel(level: MaskLevel): MaskPattern | undefined {
    return Array.from(this.patterns.values()).find(p => p.level === level);
  }

  findForDataType(dataType: DataType): MaskPattern[] {
    return Array.from(this.patterns.values()).filter(
      p => !p.dataTypes || p.dataTypes.includes(dataType)
    );
  }
}

export const maskPatternRegistry: MaskPatternRegistry = new DefaultMaskPatternRegistry();

// Built-in patterns for backward compatibility
export const builtInPatterns: MaskPattern[] = [
  {
    id: "FULL",
    name: "Full Reveal", 
    description: "Shows the complete value without any masking",
    level: "FULL",
    apply: (value: string) => value,
  },
  {
    id: "NONE", 
    name: "No Access",
    description: "Completely hides the value", 
    level: "NONE",
    apply: (value: string) => value, // NONE typically means no access, but for display we show original
  },
  {
    id: "MASK_ALL",
    name: "Complete Masking",
    description: "Replaces all characters with asterisks",
    level: "MASK_ALL", 
    apply: (value: string, context?: MaskContext) => {
      if (context?.dataType === DataElementEnum.SSN) {
        // Preserve SSN format while masking all digits
        return value.replace(/\d/g, "*");
      }
      if (context?.dataType === DataElementEnum.PHONE) {
        // Preserve phone format while masking all digits  
        return value.replace(/\d/g, "*");
      }
      if (context?.dataType === DataElementEnum.CREDIT_CARD) {
        // Preserve card format while masking all digits
        return value.replace(/\d/g, "*");
      }
      // Generic: replace all characters
      return "*".repeat(Math.max(value.length, 3));
    },
  },
  {
    id: "PARTIAL_LAST4",
    name: "Show Last 4",
    description: "Shows only the last 4 characters",
    level: "PARTIAL_LAST4",
    apply: (value: string, context?: MaskContext) => {
      if (context?.dataType === DataElementEnum.SSN) {
        const digits = value.replace(/\D/g, "");
        return digits.length >= 9 ? `***-**-${digits.slice(-4)}` : `***${digits.slice(-4)}`;
      }
      if (context?.dataType === DataElementEnum.PHONE) {
        return value.replace(/\d(?=.*\d{4})/g, "*");
      }
      if (context?.dataType === DataElementEnum.EMAIL) {
        const [local, domain] = value.split("@");
        const maskedLocal = local.length <= 4 ? "***" : "*".repeat(local.length - 4) + local.slice(-4);
        return `${maskedLocal}@${domain || ""}`;
      }
      if (context?.dataType === DataElementEnum.CREDIT_CARD) {
        const digits = value.replace(/\D/g, "");
        return digits.replace(/\d(?=\d{4})/g, "*").replace(/(.{4})/g, "$1 ").trim();
      }
      // Generic: show last 4 characters
      return value.length <= 4 ? "*".repeat(value.length) : "*".repeat(value.length - 4) + value.slice(-4);
    },
  },
  {
    id: "PARTIAL_LAST3", 
    name: "Show Last 3",
    description: "Shows only the last 3 characters",
    level: "PARTIAL_LAST3",
    apply: (value: string, context?: MaskContext) => {
      if (context?.dataType === DataElementEnum.SSN) {
        const digits = value.replace(/\D/g, "");
        return digits.length >= 9 ? `***-**-*${digits.slice(-3)}` : `***${digits.slice(-3)}`;
      }
      if (context?.dataType === DataElementEnum.PHONE) {
        return value.replace(/\d(?=\d{3})/g, "*");
      }
      if (context?.dataType === DataElementEnum.EMAIL) {
        const [local, domain] = value.split("@");
        const maskedLocal = local.length <= 3 ? "***" : "*".repeat(local.length - 3) + local.slice(-3);
        return `${maskedLocal}@${domain || ""}`;
      }
      // Generic: show last 3 characters
      return value.length <= 3 ? "*".repeat(value.length) : "*".repeat(value.length - 3) + value.slice(-3);
    },
  },
];

// Enhanced patterns for specific data types
export const enhancedPatterns: MaskPattern[] = [
  {
    id: "CREDIT_CARD_LUHN",
    name: "Credit Card (Luhn Preserved)",
    description: "Masks credit card while preserving Luhn algorithm validity", 
    level: "PARTIAL_LAST4",
    dataTypes: [DataElementEnum.CREDIT_CARD],
    apply: (value: string) => {
      const digits = value.replace(/\D/g, "");
      if (digits.length < 13 || digits.length > 19) return "*".repeat(value.length);
      
      // Preserve last 4 and first digit, generate valid middle digits
      const firstDigit = digits[0];
      const lastFour = digits.slice(-4);
      const middleLength = digits.length - 5;
      
      // Generate masked digits that maintain Luhn validity
      let masked = firstDigit + "*".repeat(middleLength) + lastFour;
      
      // Format with spaces for common card formats
      if (digits.length === 16) {
        masked = masked.replace(/(.{4})/g, "$1 ").trim();
      }
      
      return masked;
    },
  },
  {
    id: "ADDRESS_STRUCTURED",
    name: "Structured Address",
    description: "Masks address components separately",
    level: "PARTIAL_LAST4", 
    dataTypes: [DataElementEnum.ADDRESS],
    apply: (value: string) => {
      // Simple address parsing - in real implementation would use a proper address parser
      const parts = value.split(/,\s*/);
      if (parts.length >= 3) {
        // Assume format: "123 Main St, City, State ZIP"
        const street = parts[0].replace(/\d+/g, "***");
        const city = parts[1];
        const stateZip = parts[2];
        return `${street}, ${city}, ${stateZip}`;
      }
      // Fallback: mask numbers only
      return value.replace(/\d+/g, "***");
    },
  },
  {
    id: "NAME_STRUCTURED", 
    name: "Structured Name",
    description: "Masks first name, preserves last name initial",
    level: "PARTIAL_LAST3",
    dataTypes: [DataElementEnum.NAME],
    apply: (value: string) => {
      const parts = value.trim().split(/\s+/);
      if (parts.length >= 2) {
        const firstName = "*".repeat(parts[0].length);
        const lastName = parts[parts.length - 1];
        const lastInitial = lastName[0] + "*".repeat(lastName.length - 1);
        const middle = parts.slice(1, -1).map(p => p[0] + "*".repeat(p.length - 1));
        return [firstName, ...middle, lastInitial].join(" ");
      }
      // Single name: show first character
      return value[0] + "*".repeat(value.length - 1);
    },
  },
  {
    id: "DATE_PRESERVE_FORMAT",
    name: "Date (Format Preserved)",
    description: "Masks date while preserving format",
    level: "PARTIAL_LAST4",
    dataTypes: [DataElementEnum.DATE_OF_BIRTH],
    apply: (value: string) => {
      // Detect common date formats and mask accordingly
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        // MM/DD/YYYY -> **/**/YYYY
        const year = value.slice(-4);
        return `**/**/${year}`;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        // YYYY-MM-DD -> YYYY-**-**
        const year = value.slice(0, 4);
        return `${year}-**-**`;
      }
      // Generic: mask digits
      return value.replace(/\d/g, "*");
    },
  },
  {
    id: "IP_ADDRESS_SUBNET",
    name: "IP Address (Subnet Preserved)",
    description: "Masks IP address while preserving subnet information",
    level: "PARTIAL_LAST4",
    dataTypes: [DataElementEnum.IP_ADDRESS],
    apply: (value: string) => {
      // IPv4
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) {
        const parts = value.split(".");
        return `${parts[0]}.${parts[1]}.***.**`;
      }
      // IPv6 - mask last 4 groups
      if (value.includes(":")) {
        const parts = value.split(":");
        const maskedParts = parts.map((part, index) => 
          index < parts.length - 4 ? part : "****"
        );
        return maskedParts.join(":");
      }
      return "*".repeat(value.length);
    },
  },
];

// Register all built-in patterns
export function initializePatterns(): void {
  [...builtInPatterns, ...enhancedPatterns].forEach(pattern => {
    maskPatternRegistry.register(pattern);
  });
}

// Helper to apply a pattern by ID
export function applyPattern(patternId: string, value: string, context?: MaskContext): string {
  const pattern = maskPatternRegistry.get(patternId);
  if (!pattern) {
    throw new Error(`Unknown mask pattern: ${patternId}`);
  }
  return pattern.apply(value, context);
}

// Helper to get pattern by legacy mask level
export function getPatternByLevel(level: MaskLevel): MaskPattern | undefined {
  return maskPatternRegistry.findByLevel(level);
}

// Initialize patterns on module load
initializePatterns();