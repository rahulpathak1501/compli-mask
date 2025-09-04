import { useEffect, useState } from "react";

import {
  fallbackMaskers,
  type DataElementEnum,
  type MaskingLevel,
} from "../shared";

interface MaskedTextProps {
  value: string;
  dataType: DataElementEnum | string;
  role: string;
  maskingLevel?: MaskingLevel | string;
  customMasker?: (val: string) => string;
  customPattern?: RegExp;
  aiProvider?: (
    value: string,
    dataType: string,
    role: string
  ) => Promise<string | string[] | undefined>; // Accept string OR array OR undefined
  className?: string;
}

export const MaskedText: React.FC<MaskedTextProps> = ({
  value,
  dataType,
  role,
  maskingLevel,
  customMasker,
  customPattern,
  aiProvider,
  className = "",
}) => {
  const [masked, setMasked] = useState(value);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"AI" | "Policy" | "Custom">("Policy");

  useEffect(() => {
    const fetchMasked = async () => {
      setLoading(true);
      try {
        if (customMasker) {
          setMasked(customMasker(value));
          setSource("Custom");
        } else if (aiProvider) {
          const aiResult = await aiProvider(value, dataType, role);
          if (typeof aiResult === "string") {
            setMasked(aiResult);
          } else if (Array.isArray(aiResult)) {
            // If AI returns an array of patterns, join or select fallback representation
            setMasked(aiResult.join(", "));
          } else {
            // If AI returns undefined, fallback to server API below
            const res = await fetch("/api/mask", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                value,
                dataType,
                role,
                maskingLevel,
                customPattern,
              }),
            });
            const data = await res.json();
            if (res.ok) {
              setMasked(data.masked);
              setSource("Policy");
            } else if (dataType in fallbackMaskers) {
              setMasked(
                fallbackMaskers[dataType as DataElementEnum](
                  value,
                  customPattern
                )
              );
              setSource("Policy");
            } else {
              setMasked(value);
              setSource("Policy");
            }
          }
          setSource("AI");
        } else {
          const res = await fetch("/api/mask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              value,
              dataType,
              role,
              maskingLevel,
              customPattern,
            }),
          });
          const data = await res.json();
          if (res.ok) {
            setMasked(data.masked);
            setSource("Policy");
          } else if (dataType in fallbackMaskers) {
            setMasked(
              fallbackMaskers[dataType as DataElementEnum](value, customPattern)
            );
            setSource("Policy");
          } else {
            setMasked(value);
            setSource("Policy");
          }
        }
      } catch {
        if (dataType in fallbackMaskers) {
          setMasked(
            fallbackMaskers[dataType as DataElementEnum](value, customPattern)
          );
          setSource("Policy");
        } else {
          setMasked(value);
          setSource("Policy");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMasked();
  }, [
    value,
    dataType,
    role,
    maskingLevel,
    customMasker,
    customPattern,
    aiProvider,
  ]);

  return (
    <span className={className}>
      {loading ? "Loading..." : masked} <small>Masked by {source}</small>
    </span>
  );
};
