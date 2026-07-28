"use client";

import { useEffect, useState } from "react";

function diff(target: number) {
  const now = Date.now();
  const d = Math.max(0, target - now);

  return {
    dias: Math.floor(d / 86400000),
    horas: Math.floor((d % 86400000) / 3600000),
    min: Math.floor((d % 3600000) / 60000),
    seg: Math.floor((d % 60000) / 1000),
  };
}

export default function Countdown({ dateIso }: { dateIso: string }) {
  const target = new Date(dateIso).getTime();

  const [t, setT] = useState({
    dias: 0,
    horas: 0,
    min: 0,
    seg: 0,
  });

  useEffect(() => {
    setT(diff(target));

    const id = setInterval(() => {
      setT(diff(target));
    }, 1000);

    return () => clearInterval(id);
  }, [target]);

  const items = [
    { label: "dias", value: t.dias },
    { label: "horas", value: t.horas },
    { label: "min", value: t.min },
    { label: "seg", value: t.seg },
  ];

  return (
    <div className="flex justify-center gap-4 sm:gap-8">
      {items.map((i) => (
        <div key={i.label} className="text-center">
          <div className="font-display text-4xl sm:text-6xl text-wine tabular-nums">
            {String(i.value).padStart(2, "0")}
          </div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-stone mt-1">
            {i.label}
          </div>
        </div>
      ))}
    </div>
  );
}