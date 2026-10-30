import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCheck,
  Clock3,
  FileCheck2,
} from "lucide-react";
import {
  AcademicBrief,
  DesignSettings,
  QualityIssue,
  audiences,
  purposes,
  inspectDeck,
  Reference,
  Slide,
  wordCount,
  visibleSlideText,
  withClippedIssues,
} from "./model";

export default function QualityPanel({
  slides,
  onSelect,
  references,
  brief,
  design,
  clipped,
}: {
  slides: Slide[];
  references?: Reference[];
  brief?: AcademicBrief;
  design?: DesignSettings;
  clipped?: ReadonlySet<string>;
  onSelect: (index: number) => void;
}) {
  const issues = withClippedIssues(
    inspectDeck(slides, references, design),
    slides,
    clipped,
  );
  const [kind, setKind] = useState<QualityIssue["kind"] | "all">("all");
  const kinds: { id: QualityIssue["kind"]; name: string }[] = [
    { id: "empty", name: "Boş sahələr" },
    { id: "length", name: "Mətn həcmi" },
    { id: "placeholder", name: "Qalmış göstərişlər" },
    { id: "citation", name: "İstinadlar" },
    { id: "data", name: "Struktur məlumatları" },
  ];
  const visibleIssues =
    kind === "all" ? issues : issues.filter((issue) => issue.kind === kind);
  const words = slides.reduce((n, s) => n + wordCount(visibleSlideText(s)), 0);
  const minutes = Math.max(1, Math.ceil(words / 110));
  const problematic = new Set(issues.map((i) => i.slideId)).size;
  return (
    <section className="quality-panel" aria-label="Təqdimatın yoxlanışı">
      <div className="quality-title">
        <span>
          <FileCheck2 size={17} />
          Son baxış
        </span>
        <span
          className={issues.length ? "quality-count" : "quality-count ready"}
        >
          {issues.length ? `${issues.length} qeyd` : "Hazırdır"}
        </span>
      </div>
      {brief && (
        <p className="brief-summary">
          {purposes.find((p) => p.id === brief.purpose)?.name} ·{" "}
          {audiences.find((a) => a.id === brief.audience)?.name}
        </p>
      )}
      <div className="deck-metrics">
        <div>
          <b>{slides.length}</b>
          <span>slayd</span>
        </div>
        <div>
          <b>{words}</b>
          <span>söz</span>
        </div>
        <div>
          <b>~{minutes}</b>
          <span>dəqiqə</span>
        </div>
      </div>
      <p className="duration-hint">
        <Clock3 size={12} />
        Vaxt 110 söz/dəqiqə üzrə təxmini hesablanır.
      </p>
      {brief && (
        <p
          className={`time-budget ${minutes > brief.targetMinutes ? "over" : ""}`}
        >
          Hədəf: {brief.targetMinutes} dəqiqə.{" "}
          {minutes > brief.targetMinutes
            ? "Mətnin həcmi hədəf vaxtdan uzundur; qısaltmağı və ya vaxtı artırmağı düşün."
            : "Təxmini mətn həcmi hədəf vaxta uyğundur."}
        </p>
      )}
      {issues.length ? (
        <>
          <p className="quality-summary">
            {problematic} slayda yenidən baxmağı tövsiyə edirik.
          </p>
          <label className="quality-filter">
            Yoxlama növü
            <select
              aria-label="Yoxlama növünə görə süz"
              value={kind}
              onChange={(e) =>
                setKind(e.target.value as QualityIssue["kind"] | "all")
              }
            >
              <option value="all">Bütün qeydlər ({issues.length})</option>
              {kinds.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (
                  {issues.filter((issue) => issue.kind === item.id).length})
                </option>
              ))}
            </select>
          </label>
          {!visibleIssues.length && (
            <p role="status">Bu növdə yoxlanmalı qeyd yoxdur.</p>
          )}
          <div className="quality-issues">
            {visibleIssues.map((issue, i) => (
              <button
                key={`${issue.slideId}-${i}`}
                onClick={() => onSelect(issue.index)}
              >
                <AlertCircle size={14} />
                <span>
                  <b>Slayd {issue.index + 1}</b>
                  {issue.message}
                </span>
                <ArrowRight size={13} />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="quality-ready">
          <CheckCheck size={18} />
          <span>Mətn həcmi və tamamlanma yoxlamaları keçdi.</span>
        </div>
      )}
      <p className="quality-disclaimer">
        Bu yoxlama faktların və akademik istinadların doğruluğunu təsdiqləmir.
      </p>
    </section>
  );
}
