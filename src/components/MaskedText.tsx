import React, { useEffect, useState } from "react";
import { DataElementEnum } from "../shared";
import { fallbackMaskers } from "../shared";

interface MaskedTextProps {
  value: string;
  dataType: DataElementEnum;
  role: string;
  className?: string;
}

export const MaskedText: React.FC<MaskedTextProps> = ({
  value,
  dataType,
  role,
  className = "",
}) => {
  const [masked, setMasked] = useState(value);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"AI" | "Policy">("Policy");

  useEffect(() => {
    const fetchMasked = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/mask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value, dataType, role }),
        });
        const data = await res.json() as { 
          masked: string; 
          level: string; 
          reason: string; 
          source: "AI" | "Policy" 
        };
        if (res.ok) {
          setMasked(data.masked);
          setSource(data.source);
        } else {
          setMasked(fallbackMaskers[dataType](value));
        }
      } catch {
        setMasked(fallbackMaskers[dataType](value));
        setSource("Policy");
      } finally {
        setLoading(false);
      }
    };
    fetchMasked();
  }, [value, dataType, role]);

  return (
    <span className={className}>
      {loading ? "Loading..." : masked}
      <small className="block text-gray-500 text-xs">Masked by {source}</small>
    </span>
  );
};
