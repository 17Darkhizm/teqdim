import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Reference, uid } from "./model";

export default function PdfUpload({
  references,
  onChange,
}: {
  references: Reference[];
  onChange: (refs: Reference[]) => void;
}) {
  const [pending, setPending] = useState<{
    name: string;
    count: number;
  } | null>(null);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(1);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const doc = useRef<PDFDocumentProxy | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const generation = useRef(0);
  // A changed material list invalidates work started for the previous list.
  useEffect(() => {
    generation.current++;
    const previous = doc.current;
    doc.current = null;
    void previous?.loadingTask.destroy();
    setPending(null);
    setBusy(false);
    setProgress("");
    setError("");
  }, [references]);
  useEffect(
    () => () => {
      generation.current++;
      void doc.current?.loadingTask.destroy();
    },
    [],
  );
  async function select(file?: File) {
    if (!file || busy) return;
    setError("");
    setPending(null);
    setBusy(true);
    setProgress("PDF açılır…");
    const current = ++generation.current;
    let opened: PDFDocumentProxy | null = null;
    try {
      await doc.current?.loadingTask.destroy();
      doc.current = null;
      const { openPdf } = await import("./pdf");
      opened = await openPdf(file);
      if (generation.current !== current) {
        await opened.loadingTask.destroy();
        return;
      }
      doc.current = opened;
      setPending({ name: file.name, count: opened.numPages });
      setFrom(1);
      setTo(Math.min(10, opened.numPages));
    } catch (e) {
      if (current === generation.current)
        setError(e instanceof Error ? e.message : "PDF açılmadı.");
    } finally {
      if (current === generation.current) {
        setBusy(false);
        setProgress("");
      }
      if (input.current) input.current.value = "";
    }
  }
  async function extract() {
    if (!doc.current || !pending || busy) return;
    const current = generation.current;
    setBusy(true);
    setError("");
    setProgress("Mətn oxunur…");
    try {
      const { readPdfPages } = await import("./pdf");
      const pages = await readPdfPages(doc.current, from, to, (page) => {
        if (generation.current === current)
          setProgress(`${page - from + 1} / ${to - from + 1} səhifə oxunur…`);
      });
      if (generation.current !== current) return;
      const total =
        references.reduce(
          (sum, r) => sum + r.pages.reduce((n, p) => n + p.text.length, 0),
          0,
        ) + pages.reduce((n, p) => n + p.text.length, 0);
      if (total > 100000)
        throw new Error(
          "Ümumi PDF mətni 100 000 simvolu keçir. Daha az səhifə seç və ya əvvəlki faylı çıxar.",
        );
      onChange([
        ...references,
        { id: uid(), name: pending.name, pageCount: pending.count, pages },
      ]);
      setPending(null);
      await doc.current?.loadingTask.destroy();
      doc.current = null;
    } catch (e) {
      if (generation.current === current)
        setError(e instanceof Error ? e.message : "Mətn çıxarılmadı.");
    } finally {
      if (generation.current === current) {
        setBusy(false);
        setProgress("");
      }
    }
  }
  return (
    <section className="pdf-upload" aria-label="PDF istinad materialları">
      <div className="upload-label">
        <label htmlFor="pdf-file">
          İstinad materialları <span className="optional">İstəyə bağlı</span>
        </label>
        <span>{references.length}/3 PDF</span>
      </div>
      <input
        ref={input}
        id="pdf-file"
        className="sr-only"
        type="file"
        accept=".pdf,application/pdf"
        disabled={busy || references.length >= 3}
        onChange={(e) => void select(e.target.files?.[0])}
      />
      {references.length < 3 && !pending && (
        <button
          type="button"
          className={`upload-drop ${dragging ? "dragging" : ""}`}
          disabled={busy}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length > 1) {
              setError("Faylları bir-bir əlavə et.");
              return;
            }
            void select(e.dataTransfer.files[0]);
          }}
        >
          <span className="upload-glyph">
            {busy ? (
              <Loader2 size={23} className="spin" />
            ) : (
              <UploadCloud size={23} />
            )}
          </span>
          <strong>{busy ? progress : "PDF-i buraya at və ya seç"}</strong>
          <span>Dərslik, məqalə, mühazirə qeydləri · ən çox 20 MB</span>
          <em>Yalnız bu brauzerdə oxunur</em>
        </button>
      )}
      {pending && (
        <div className="pdf-pending">
          <div className="pdf-file-heading">
            <FileText size={19} />
            <div>
              <strong>{pending.name}</strong>
              <span>
                {pending.count} səhifə · İstifadə edəcəyin aralığı seç
              </span>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="PDF seçimini ləğv et"
              disabled={busy}
              onClick={() => {
                generation.current++;
                void doc.current?.loadingTask.destroy();
                doc.current = null;
                setPending(null);
                setError("");
              }}
            >
              <X size={16} />
            </button>
          </div>
          <div className="pdf-range">
            <div>
              <label htmlFor="pdf-from">İlk səhifə</label>
              <input
                id="pdf-from"
                type="number"
                min={1}
                max={pending.count}
                disabled={busy}
                value={Number.isNaN(from) ? "" : from}
                onChange={(e) => setFrom(e.target.valueAsNumber)}
              />
            </div>
            <span>—</span>
            <div>
              <label htmlFor="pdf-to">Son səhifə</label>
              <input
                id="pdf-to"
                type="number"
                min={from || 1}
                max={pending.count}
                disabled={busy}
                value={Number.isNaN(to) ? "" : to}
                onChange={(e) => setTo(e.target.valueAsNumber)}
              />
            </div>
          </div>
          <p className="range-note">
            Bir dəfəyə ən çox 50 səhifə. Səhifə nömrəsi fayldakı sıraya
            əsaslanır.
          </p>
          <button
            type="button"
            className="primary full"
            disabled={busy}
            onClick={() => void extract()}
          >
            {busy ? (
              <>
                <Loader2 size={15} className="spin" />
                {progress}
              </>
            ) : (
              <>
                Materiala əlavə et
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      )}
      {references.map((ref) => (
        <div className="pdf-reference" key={ref.id}>
          <span className="pdf-file-icon">
            <FileText size={19} />
          </span>
          <div>
            <strong>{ref.name}</strong>
            <span>
              {ref.pages.length} səhifə əlavə edilib ·{" "}
              {ref.pages.filter((p) => !p.text.trim()).length
                ? `${ref.pages.filter((p) => !p.text.trim()).length} səhifədə mətn yoxdur`
                : `${ref.pages.reduce((n, p) => n + p.text.length, 0).toLocaleString("az-AZ")} simvol`}
            </span>
            <span className="reference-range">
              Səh. {ref.pages[0].number}–
              {ref.pages[ref.pages.length - 1].number}
            </span>
          </div>
          <Check size={15} className="reference-check" />
          <button
            type="button"
            className="icon-button"
            disabled={busy}
            aria-label={`${ref.name} faylını materiallardan çıxar`}
            onClick={() => onChange(references.filter((r) => r.id !== ref.id))}
          >
            <X size={15} />
          </button>
          <details>
            <summary>Çıxarılmış mətnə bax</summary>
            <div>
              {ref.pages.map((p) => (
                <section key={p.number}>
                  <b>Səhifə {p.number}</b>
                  <p>{p.text || "Bu səhifədə oxuna bilən mətn yoxdur."}</p>
                </section>
              ))}
            </div>
          </details>
        </div>
      ))}
      {error && (
        <p role="alert" className="pdf-error">
          {error}
        </p>
      )}
      <p className="upload-hint">
        PDF-dəki mətn mənbə kimi istifadə olunur, dizaynı köçürülmür. Skan
        sənədlər üçün OCR hələ yoxdur.
      </p>
    </section>
  );
}
