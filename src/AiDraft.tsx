import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { requestAiPlan, type AiInput, type AiPlan } from "./ai";
import { AiServerStatus, useAiServer } from "./AiStatus";
import type { Slide } from "./model";

export default function AiDraft({ input, inputKey, onApply }: {
  input: AiInput; inputKey: string; onApply: (slides: Slide[], key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AiPlan | null>(null);
  const { server, ready, check, reset } = useAiServer();
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    setBusy(false); setResult(null); setConsent(false); setError("");
    return () => { generation.current++; controller.current?.abort(); };
  }, [inputKey]);
  function cancel() {
    generation.current++; controller.current?.abort(); controller.current = null;
    setBusy(false); setError("");
  }
  async function generate() {
    if (!consent || busy) return;
    cancel();
    const id = ++generation.current;
    const next = new AbortController(); controller.current = next;
    const timer = setTimeout(() => next.abort(), 95000);
    setBusy(true); setError(""); setResult(null);
    try {
      const plan = await requestAiPlan(input, next.signal);
      if (id === generation.current) setResult(plan);
    } catch (error) {
      if (id === generation.current) setError(next.signal.aborted ? "Gözləmə vaxtı bitdi. Yenidən yoxla." : error instanceof Error ? error.message : "AI planı alınmadı.");
    } finally {
      clearTimeout(timer);
      if (id === generation.current) { setBusy(false); controller.current = null; }
    }
  }
  return <section className="ai-draft" aria-label="AI ilə plan hazırlamaq">
    <button type="button" className="secondary full" aria-expanded={open} onClick={() => {
      if (open) { cancel(); setConsent(false); setResult(null); reset(); }
      else void check();
      setOpen(!open);
    }}><Sparkles size={16} /> DeepSeek ilə plan hazırla</button>
    {open && <div className="ai-draft-body">
      <p>Razılıq verib «AI planını yarat» düyməsini seçəndə Təqdim mövzunu, materialını, slayd sayını, təqdimatın növünü, məqsədini, auditoriyasını və planlaşdırdığın çıxış müddətini DeepSeek-ə göndərir. Sənədlərdən çıxarılan mətnlər, səhifə məlumatları və sənədlərin daxili kodları da göndərilir. İlkin fayllar, fayl adları, “Hazırlayan”, universitet, müəllim və qrup sahələri göndərilmir.</p>
      <AiServerStatus server={server} onRetry={() => void check()} />
      <label className="ai-consent"><input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)} /> Bu məlumatların DeepSeek-ə göndərilməsinə razıyam.</label>
      <button type="button" className="primary full" disabled={busy || !ready || !consent || !input.topic.trim() || (!input.material.trim() && !input.references.some(ref => ref.pages.some(page => page.text.trim())))} onClick={() => void generate()}>
        {busy ? <><Loader2 size={15} className="spin" /> Plan hazırlanır…</> : "AI planını yarat"}
      </button>
      {busy && <button type="button" className="text-button" onClick={cancel}><X size={14} /> Sorğunu ləğv et</button>}
      {error && <p role="alert" className="pdf-error">{error}</p>}
      {result && <div className="ai-plan-preview">
        <p role="status">{result.slides.length} slayd hazırlandı. Hələ cari təqdimata tətbiq edilməyib.</p>
        {result.warnings.map((warning, i) => <p className="ai-warning" key={i}>{warning}</p>)}
        <details><summary>AI planına bax</summary>{result.slides.map((slide, i) => <section key={slide.id}><strong>{i + 1}. {slide.title}</strong><p>{slide.body}</p></section>)}</details>
        <button type="button" className="primary full" onClick={() => onApply(result.slides, inputKey)}>AI planını tətbiq et</button>
      </div>}
    </div>}
  </section>;
}
