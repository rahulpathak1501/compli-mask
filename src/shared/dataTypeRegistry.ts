import type { MaskLevel } from "./types";

export interface DataTypeConfig {
  name: string;
  patterns: RegExp[];
  maskingStrategies: string[];
  defaultLevel: MaskLevel;
  validators: ((value: string) => boolean)[];
}

export class DataTypeRegistry {
  private types = new Map<string, DataTypeConfig>();

  register(type: string, config: DataTypeConfig) {
    this.types.set(type, config);
  }

  detect(value: string): string[] {
    return Array.from(this.types.entries())
      .filter(([_, config]) =>
        config.patterns.some((pattern) => pattern.test(value))
      )
      .map(([type, _]) => type);
  }
}
