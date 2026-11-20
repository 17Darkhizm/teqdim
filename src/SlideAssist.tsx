import { useEffect, useRef, useState } from "react";
import { Check, Loader2, MessageSquareText, Shrink, Sparkles, WandSparkles, X } from "lucide-react";
import { assistModes, requestSlideAssist, type AssistMode, type AssistResult } from "./ai";
import { AiServerStatus, useAiServer } from "./AiStatus";
import type { AcademicBrief, Layout, Reference, Slide } from "./model";

const modes: { id: AssistMode; name: string; detail: string; icon: typeof Shrink }[] = [
  { id: "shorten", name: "Qısalt", detail: "Mənanı saxlayaraq mətni qısaldır. Çıxarılan təfərrüatlar çıxış qeydlərinin sonuna əlavə olunur.", icon: Shrink },
  { id: "clarify", name: "Aydın yaz", detail: "Mətni daha aydın və səlis yazır, uzunluğunu təxminən saxlayır.", icon: Sparkles },
  { id: "notes", name: "Çıxış qeydi yaz", detail: "Slaydı izah etmək üçün qeyd hazırlayır. Tətbiq etsən, mövcud qeydləri əvəz edir.", icon: MessageSquareText },
];

export default function SlideAssist({ slide, layout, topic, brief, references, contentKey, onApply }: {
  slide: Slide; layout: Layout; topic: string; brief: AcademicBrief; references: Reference[];
  /** Changes whenever the slide's text changes; an older suggestion is then discarded. */
  contentKey: string;
  onApply: (result: AssistResult, key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<AssistMode | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ value: AssistResult; key: string } | null>(null);
  const { server, ready, check, reset } = useAiServer();
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  function cancel() {
    generation.current++; controller.current?.abort(); controller.current = null;
    setBusy(null);
  }
  useEffect(() => {
    cancel(); setConsent(false); setResult(null); setError("");
    return () => { generation.current++; controller.current?.abort(); };
  }, [contentKey]);
  async function run(mode: AssistMode) {
    if (!consent || busy) return;
    cancel();
    const id = ++generation.current;
    const next = new AbortController(); controller.current = next;
    const timer = setTimeout(() => next.abort(), 95000);
    const key = contentKey;
    setBusy(mode); setError(""); setResult(null);
    try {
      const value = await requestSlideAssist({ mode, topic, brief, slide, layout, references }, next.signal);
      if (id === generation.current) setResult({ value, key });
    } catch (error) {
      if (id === generation.current) setError(next.signal.aborted ? "Gözləmə vaxtı bitdi. Yenidən yoxla." : error instanceof Error ? error.message : "AI düzəlişi alınmadı.");
    } finally {
      clearTimeout(timer);
      if (id === generation.current) { setBusy(null); controller.current = null; }
    }
  }
  const available = assistModes(slide, layout);
  const rows = result ? ([
    ["Başlıq", slide.title, result.value.slide.title],
    ["Mətn", slide.body, result.value.slide.body],
    ["Çıxış qeydləri", slide.notes || "", result.value.slide.notes],
  ] as const).filter(([label, before, after]) => (result.value.mode === "notes" ? label === "Çıxış qeydləri" : true) && before !== after) : [];
  return <section className="slide-assist" aria-label="AI ilə slayd düzəlişi">
    <button type="button" className="text-button" aria-expanded={open} onClick={() => {
      if (open) { cancel(); setConsent(false); setResult(null); setError(""); reset(); }
      else void check();
      setOpen(!open);
    }}><WandSparkles size={14} /> AI ilə düzəliş (DeepSeek)</button>
    {open && <div className="slide-assist-body">
      <p>Razılıq verib əməliyyatı seçəndə Təqdim həmin əməliyyatı, təqdimatın mövzusunu, növünü, məqsədini, auditoriyasını və planlaşdırdığın çıxış müddətini DeepSeek-ə göndərir. Slaydın düzülüşü, başlığı, mətni (cədvəl və diaqramdakı yazılar da daxil olmaqla) və çıxış qeydləri də göndərilir. İstinad olunan sənədlərin müvafiq mətnləri, səhifə məlumatları və daxili kodları göndərilir. Fayl adları və şəxsi sahələr göndərilmir.</p>
      <AiServerStatus server={server} onRetry={() => void check()} />
      <label className="ai-consent"><input type="checkbox" checked={consent} disabled={!!busy} onChange={event => setConsent(event.target.checked)} /> Yuxarıda sadalanan məlumatların DeepSeek-ə göndərilməsinə razıyam.</label>
      <div className="slide-assist-modes">
        {modes.map(mode => {
          const Icon = mode.icon;
          const supported = available.includes(mode.id);
          return <button type="button" key={mode.id} className="secondary"
            title={supported ? mode.detail : mode.id === "notes"
              ? "Əvvəlcə slayda görünən mətn əlavə et."
              : "Mətn düzülüşü seç və slaydın mətnini yaz."}
            disabled={!ready || !consent || !!busy || !supported} onClick={() => void run(mode.id)}>
            {busy === mode.id ? <Loader2 size={14} className="spin" /> : <Icon size={14} />} {mode.name}
          </button>;
        })}
      </div>
      {busy && <p role="status" className="assist-busy">AI təklifi hazırlanır… <button type="button" className="text-button" onClick={cancel}><X size={14} /> Ləğv et</button></p>}
      {error && <p role="alert" className="pdf-error">{error}</p>}
      {result && <div className="assist-result">
        {rows.length ? <>
          <p role="status">AI təklifi hazırdır. Hələ slayda tətbiq edilməyib.</p>
          {result.value.warnings.map((warning, i) => <p className="ai-warning" key={i}>{warning}</p>)}
          <div className="assist-compare">
            {rows.map(([label, before, after]) => <div className="assist-row" key={label}>
              <b>{label}</b>
              <div><small>İndiki</small><p>{before || "—"}</p></div>
              <div className="after"><small>AI təklifi</small><p>{after}</p></div>
            </div>)}
          </div>
          <div className="assist-actions">
            <button type="button" className="primary" onClick={() => { onApply(result.value, result.key); setResult(null); }}><Check size={14} /> Tətbiq et</button>
            <button type="button" className="text-button" onClick={() => setResult(null)}>İmtina et</button>
          </div>
        </> : <p role="status">AI dəyişiklik təklif etmədi.</p>}
      </div>}
    </div>}
  </section>;
}
