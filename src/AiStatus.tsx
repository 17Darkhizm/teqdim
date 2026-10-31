import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { checkAiStatus, type AiStatus } from "./ai";

const statusText = {
  offline: "Yerli AI serveri işləmir. Təqdimi Baslat.cmd ilə aç və ya ayrıca terminalda «npm run api» əmrini işlət.",
  unconfigured: "AI serveri işləyir, amma DeepSeek açarı qurulmayıb. Açarı .env faylına yaz və serveri yenidən başlat (docs/BACKEND.md).",
};
export type ServerState = AiStatus | "checking" | null;

/** Health of the local AI server, checked on demand; a newer check or reset cancels the older one. */
export function useAiServer() {
  const [server, setServer] = useState<ServerState>(null);
  const health = useRef<AbortController | null>(null);
  useEffect(() => () => health.current?.abort(), []);
  const check = useCallback(async () => {
    health.current?.abort();
    const next = new AbortController(); health.current = next;
    setServer("checking");
    try {
      const status = await checkAiStatus(next.signal);
      if (health.current === next) setServer(status);
    } catch {
      // Aborted: the panel was closed or a newer check started.
    } finally {
      if (health.current === next) health.current = null;
    }
  }, []);
  const reset = useCallback(() => {
    health.current?.abort(); health.current = null;
    setServer(null);
  }, []);
  const ready = typeof server === "object" && server?.state === "ready";
  return { server, ready, check, reset };
}

export function AiServerStatus({ server, onRetry }: { server: ServerState; onRetry: () => void }) {
  const state = typeof server === "object" && server ? server.state : "checking";
  return <div className={`ai-server-status ${state}`} aria-live="polite">
    {server === "checking" || !server ? <span><Loader2 size={14} className="spin" /> AI serveri yoxlanılır…</span>
      : server.state === "ready" ? <span>AI serveri hazırdır · DeepSeek{server.model ? ` (${server.model})` : ""}</span>
      : <>
        <span>{statusText[server.state]}</span>
        <button type="button" className="text-button" onClick={onRetry}><RefreshCw size={14} /> Yenidən yoxla</button>
      </>}
  </div>;
}
