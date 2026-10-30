import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { audiences, defaultBrief, Project } from "./model";
import SlideView from "./SlideView";
import { allocateSeconds } from "./authoring";

export const formatDuration = (milliseconds: number) => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};
export const elapsedAt = (
  accumulated: number,
  startedAt: number | null,
  now: number,
) => accumulated + (startedAt === null ? 0 : Math.max(0, now - startedAt));
export default function PracticeMode({
  project,
  selected,
  onSelect,
  onClose,
}: {
  project: Project;
  selected: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const accumulated = useRef(0);
  const started = useRef<number | null>(null);
  const brief = project.brief || defaultBrief;
  const limit = brief.targetMinutes * 60000;
  const allocation = allocateSeconds(project.slides, brief.targetMinutes);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () =>
        setElapsed(
          elapsedAt(accumulated.current, started.current, performance.now()),
        ),
      200,
    );
    return () => clearInterval(timer);
  }, [running]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        onSelect(event.key === "Home" ? 0 : project.slides.length - 1);
      }
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        onSelect(Math.min(project.slides.length - 1, selected + 1));
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        onSelect(Math.max(0, selected - 1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, project.slides.length, onSelect]);
  function toggle() {
    if (running) {
      accumulated.current = elapsedAt(
        accumulated.current,
        started.current,
        performance.now(),
      );
      started.current = null;
      setElapsed(accumulated.current);
      setRunning(false);
    } else {
      started.current = performance.now();
      setRunning(true);
    }
  }
  function reset() {
    started.current = null;
    accumulated.current = 0;
    setRunning(false);
    setElapsed(0);
  }
  return (
    <section
      className="practice-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="practice-title"
    >
      <header>
        <div>
          <span className="eyebrow">ÇIXIŞA HAZIRLAŞ</span>
          <h2 id="practice-title">Məşq otağı</h2>
          <p>
            {audiences.find((a) => a.id === brief.audience)?.name} · hədəf{" "}
            {brief.targetMinutes} dəqiqə
          </p>
        </div>
        <button className="secondary" autoFocus onClick={onClose}>
          <X size={17} />
          Məşqi bağla
        </button>
      </header>
      <div className="practice-grid">
        <div>
          <SlideView
            slide={project.slides[selected]}
            index={selected}
            total={project.slides.length}
            theme={project.theme}
            subject={project.subject}
            author={project.author}
            brief={project.brief}
            design={project.design}
          />
          <div className="practice-navigation">
            <button
              className="secondary"
              disabled={selected === 0}
              onClick={() => onSelect(selected - 1)}
            >
              <ChevronLeft size={17} />
              Əvvəlki
            </button>
            <span>
              {selected + 1} / {project.slides.length}
            </span>
            <button
              className="secondary"
              disabled={selected === project.slides.length - 1}
              onClick={() => onSelect(selected + 1)}
            >
              Növbəti
              <ChevronRight size={17} />
            </button>
          </div>
          <p className="practice-local">
            Bu məşq ekranında çıxış qeydlərin görünür. Auditoriya qarşısında
            “Təqdim et” rejimindən istifadə et.
          </p>
        </div>
        <aside>
          <div
            className={`practice-timer ${elapsed > limit ? "overtime" : ""}`}
          >
            <span>KEÇƏN VAXT</span>
            <output aria-label="Məşqin keçən vaxtı">
              {formatDuration(elapsed)}
            </output>
            <div className="time-track">
              <span
                style={{ width: `${Math.min(100, (elapsed / limit) * 100)}%` }}
              />
            </div>
            <p>
              {elapsed > limit
                ? "Hədəf vaxt keçilib"
                : `Hədəfə qədər ${formatDuration(limit - elapsed)}`}
            </p>
            <div>
              <button className="primary" onClick={toggle}>
                {running ? <Pause size={15} /> : <Play size={15} />}{" "}
                {running ? "Fasilə ver" : elapsed > 0 ? "Davam et" : "Başla"}
              </button>
              <button
                className="secondary"
                aria-label="Məşq vaxtını sıfırla"
                onClick={reset}
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
          <div className="practice-pacing">
            <strong>
              Bu slayd üçün təklif:{" "}
              {formatDuration(allocation[selected] * 1000)}
            </strong>
            <p>
              Hədəf vaxt mətn və qeydlərin söz sayına görə bölünüb. Bu, ölçülmüş
              çıxış sürəti deyil.
            </p>
            <span>
              Növbəti: {project.slides[selected + 1]?.title || "Son slayddasan"}
            </span>
          </div>
          <div className="practice-notes">
            <span>SLAYD {selected + 1} · ÇIXIŞ QEYDLƏRİ</span>
            <h3>{project.slides[selected].title}</h3>
            <p>
              {project.slides[selected].notes?.trim() ||
                "Bu slayd üçün çıxış qeydi yoxdur. Redaktorda öz qeydlərini əlavə edə bilərsən."}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
