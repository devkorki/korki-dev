import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const Ctx = createContext(null);

export function ConfigProvider({ children }) {
  const [flags, setFlags] = useState({ showPlayButton: true, showLiveBadge: true });
  const [overrides, setOverrides] = useState({});
  const [loaded, setLoaded] = useState(false);

  async function refresh() {
    const r = await fetch("/api/config", { cache: "no-store" });
    const data = await r.json();
    setFlags(data.flags || { showPlayButton: true, showLiveBadge: true });
    setOverrides(data.overrides || {});
    setLoaded(true);
  }

  useEffect(() => {
    refresh().catch(() => setLoaded(true));
  }, []);

  const value = useMemo(() => ({
    flags, overrides, loaded,
    setFlags, setOverrides,
    refresh,
  }), [flags, overrides, loaded]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConfig() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useConfig must be used inside ConfigProvider");
  return v;
}
