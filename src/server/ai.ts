// src/server/ai.ts or src/shared/ai.ts (location as per your structure)
export type AIMaskingProviderResult = string | string[] | undefined;

export type AIMaskingProvider = (
  value: string,
  dataType: string,
  role: string
) => Promise<AIMaskingProviderResult>;

let providers: AIMaskingProvider[] = [];

export function setAIMaskingProviders(list: AIMaskingProvider[]) {
  providers = list.slice();
}

export async function aiSuggestMaskLevel(
  value: string,
  dataType: string,
  role: string
): Promise<AIMaskingProviderResult> {
  for (const provider of providers) {
    try {
      const res = await provider(value, dataType, role);
      if (res !== undefined) return res;
    } catch (err) {
      continue;
    }
  }
  return undefined;
}

export function setDefaultNoopProvider() {
  setAIMaskingProviders([async () => undefined]);
}
