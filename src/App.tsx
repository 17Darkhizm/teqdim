import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutGrid,
  Loader2,
  MonitorPlay,
  Timer,
  Scissors,
  MoreHorizontal,
  Moon,
  Sun,
  Plus,
  Presentation,
  Save,
  Sparkles,
  Trash2,
  Undo2,
  Redo2,
  Keyboard,
  X,
} from "lucide-react";
import {
  AcademicBrief,
  DesignSettings,
  defaultDesign,
  resolveDesign,
  defaultBrief,
  BlockKind,
  ComparisonData,
  TimelineData,
  ImageAsset,
  createBlock,
  createManualDeck,
  emptyComparison,
  emptyTimeline,
  projectImageSize,
  PROJECT_IMAGE_LIMIT,
  TableData,
  ChartData,
  emptyTable,
  emptyChart,
  BODY_LIMIT,
  citationLabel,
  createSlides,
  exportPptx,
  layoutFor,
  layouts,
  Project,
  Reference,
  sample,
  Slide,
  splitSlide,
  Theme,
  themes,
  uid,
} from "./model";
import SlideView from "./SlideView";
import QualityPanel from "./QualityPanel";
import {
  PROJECTS_KEY,
  projectContent,
  readDraft,
  readProjects,
} from "./storage";
import { useDraft } from "./useDraft";
import PdfUpload from "./PdfUpload";
import ProjectLibrary from "./ProjectLibrary";
import { downloadBackup } from "./backup";
import { useHistory } from "./useHistory";
import { useDialogKeyboard } from "./useDialogKeyboard";
import BriefForm from "./BriefForm";
import SourceInspector from "./SourceInspector";
import PracticeMode from "./PracticeMode";
import DataEditor from "./DataEditor";
import VisualEditor from "./VisualEditor";
import SlideBlocks from "./SlideBlocks";
import SlideNavigator, { SlideJump } from "./SlideNavigator";
import OutlineImport from "./OutlineImport";
import ReplaceDialog from "./ReplaceDialog";
import AgendaBuilder from "./AgendaBuilder";
import DesignGallery from "./DesignGallery";
import DesignControls from "./DesignControls";
import {
  downloadText,
  outlineMarkdown,
  speakerText,
  slideStats,
  slideText,
} from "./authoring";

export default function App() {
  const [darkMode, setDarkMode] = useState(
    () => document.documentElement.dataset.mode === "dark",
  );
  useEffect(() => {
    document.documentElement.dataset.mode = darkMode ? "dark" : "light";
    try {
      localStorage.setItem("teqdim.color-mode", darkMode ? "dark" : "light");
    } catch {
      /* The current session still supports switching. */
    }
  }, [darkMode]);
  const [restored] = useState(readDraft);
  const [pendingAction, setPendingAction] = useState<
    "new" | "rebuild" | Project | null
  >(null);
  const [projects, setProjects] = useState<Project[]>(readProjects);
  const [page, setPage] = useState<"create" | "projects">("create");
  const [step, setStep] = useState(restored?.step || 1);
  const [topic, setTopic] = useState(restored?.project.topic || "");
  const [subject, setSubject] = useState(restored?.project.subject || "");
  const [author, setAuthor] = useState(restored?.project.author || "");
  const [brief, setBrief] = useState<AcademicBrief>(
    restored?.project.brief || defaultBrief,
  );
  const [material, setMaterial] = useState(restored?.project.material || "");
  const [references, setReferences] = useState<Reference[]>(
    restored?.project.references || [],
  );
  const [count, setCount] = useState(restored?.count || 6);
  const history = useHistory<{
    slides: Slide[];
    theme: Theme;
    design: DesignSettings;
  }>({
    slides: restored?.project.slides || [],
    theme: restored?.project.theme || "sage",
    design: resolveDesign(restored?.project.design),
  });
  const { slides, theme, design } = history.value;
  function setDesign(design: DesignSettings) {
    history.set((deck) => ({ ...deck, design }));
  }
  function setSlides(value: React.SetStateAction<Slide[]>, group?: string) {
    history.set(
      (deck) => ({
        ...deck,
        slides: typeof value === "function" ? value(deck.slides) : value,
      }),
      group,
    );
  }
  function setTheme(theme: Theme) {
    history.set((deck) => (deck.theme === theme ? deck : { ...deck, theme }));
  }
  const [selectedIndex, setSelected] = useState(restored?.selected || 0);
  const selected = Math.min(selectedIndex, Math.max(0, slides.length - 1));
  const [projectId, setProjectId] = useState<string>(
    () => restored?.project.id || uid(),
  );
  const [toast, setToast] = useState(
    restored && (restored.project.topic || restored.project.slides.length)
      ? "Son qaralaman bərpa edildi."
      : "",
  );
  const [exporting, setExporting] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [practicing, setPracticing] = useState(false);
  const [blocksOpen, setBlocksOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  useDialogKeyboard(
    !!(
      help ||
      pendingAction ||
      deleteId ||
      presenting ||
      practicing ||
      blocksOpen ||
      outlineOpen ||
      replaceOpen ||
      agendaOpen ||
      galleryOpen
    ),
    () => {
      setHelp(false);
      setPendingAction(null);
      setDeleteId(null);
      setPresenting(false);
      setPracticing(false);
      setBlocksOpen(false);
      setOutlineOpen(false);
      setReplaceOpen(false);
      setAgendaOpen(false);
      setGalleryOpen(false);
    },
  );
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!presenting) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPresenting(false);
      if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        setSelected(e.key === "Home" ? 0 : slides.length - 1);
      }
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        setSelected(Math.min(slides.length - 1, selected + 1));
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setSelected(Math.max(0, selected - 1));
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [presenting, slides.length, selected]);
  const previewSlides = slides.length
    ? slides
    : createSlides(sample.topic, sample.material, 6);
  const currentProject = (): Project => ({
    id: projectId,
    topic,
    subject,
    author,
    theme,
    design,
    slides,
    references,
    material,
    brief,
    updatedAt: new Date().toISOString(),
  });
  const draftStatus = useDraft({
    project: currentProject(),
    step,
    selected,
    count,
  });
  function hasUnsavedWork() {
    if (
      !topic.trim() &&
      !material.trim() &&
      !references.length &&
      !slides.length &&
      JSON.stringify(brief) === JSON.stringify(defaultBrief)
    )
      return false;
    const saved = projects.find((p) => p.id === projectId);
    return !saved || projectContent(saved) !== projectContent(currentProject());
  }
  function duplicateCurrent() {
    if (slides.length >= 80) return;
    const copy = {
      ...slides[selected],
      id: uid(),
      title: `${slides[selected].title.slice(0, 110)} (surət)`,
    };
    if (projectImageSize([...slides, copy]) > PROJECT_IMAGE_LIMIT) {
      setToast(
        "Şəkil yaddaşı limiti bu slaydın surətini yaratmağa imkan vermir.",
      );
      return;
    }
    setSlides((items) => [
      ...items.slice(0, selected + 1),
      copy,
      ...items.slice(selected + 1),
    ]);
    setSelected(selected + 1);
  }
  function splitCurrent() {
    const chunks = splitSlide(slides[selected]);
    if (chunks.length === 1) {
      setToast("Bu slaydın mətni artıq qısadır.");
      return;
    }
    if (slides.length - 1 + chunks.length > 80) {
      setToast("Ən çox 80 slayd saxlaya bilərsən.");
      return;
    }
    setSlides((items) => [
      ...items.slice(0, selected),
      ...chunks,
      ...items.slice(selected + 1),
    ]);
    setToast(
      `Mətn ${chunks.length} oxunaqlı slayda bölündü. İstinadları yoxla.`,
    );
  }
  function persist(next: Project[]) {
    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(next));
      setProjects(next);
      return true;
    } catch {
      setToast(
        "Brauzer yaddaşına yazmaq mümkün olmadı. İşini itirməmək üçün ehtiyat nüsxəni və ya PowerPoint faylını yüklə.",
      );
      return false;
    }
  }
  function save() {
    if (!slides.length) return;
    const project = currentProject();
    if (persist([project, ...projects.filter((p) => p.id !== project.id)]))
      setToast("Təqdimat bu brauzerdə saxlanıldı.");
  }
  function load(p: Project, force = false) {
    if (!force && hasUnsavedWork()) {
      setPendingAction(p);
      return;
    }
    setReferences(p.references || []);
    setMaterial(
      p.material ??
        p.slides
          .filter((s) => !s.citations?.length)
          .slice(1, -1)
          .map((s) => s.body)
          .join("\n\n"),
    );
    setCount(Math.min(12, Math.max(4, p.slides.length)));
    setTopic(p.topic);
    setSubject(p.subject);
    setAuthor(p.author);
    setBrief(p.brief || defaultBrief);
    history.replace({
      theme: p.theme,
      slides: p.slides,
      design: resolveDesign(p.design),
    });
    setProjectId(p.id);
    setSelected(0);
    setStep(3);
    setPage("create");
  }
  function reset(force = false) {
    if (!force && hasUnsavedWork()) {
      setPendingAction("new");
      return;
    }
    setReferences([]);
    setTopic("");
    setSubject("");
    setAuthor("");
    setBrief(defaultBrief);
    setMaterial("");
    history.replace({ theme, slides: [], design });
    setSelected(0);
    setProjectId(uid());
    setStep(1);
    setPage("create");
  }
  function build(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || (!material.trim() && !references.length)) return;
    if (slides.length) {
      setPendingAction("rebuild");
      return;
    }
    generatePlan();
  }
  function generatePlan() {
    try {
      const next = createSlides(
        topic.trim(),
        material.trim(),
        count,
        references,
        brief,
      );
      history.replace({ theme, slides: next, design });
      setSelected(0);
      setStep(2);
      if (next.length !== count)
        setToast(
          `Oxunaqlılıq üçün ${next.length} slayd hazırlandı. Seçdiyin say istiqamət kimi götürülür.`,
        );
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "Plan hazırlana bilmədi.",
      );
    }
  }
  function updateSlide(id: string, field: "title" | "body", value: string) {
    setSlides(
      (items) =>
        items.map((s) =>
          s.id === id
            ? {
                ...s,
                [field]: value,
                citationReview: !!s.citations?.length || s.citationReview,
              }
            : s,
        ),
      `text:${id}:${field}`,
    );
  }
  function moveSlide(i: number, direction: number) {
    const next = [...slides];
    const target = i + direction;
    if (target < 0 || target >= next.length) return;
    [next[i], next[target]] = [next[target], next[i]];
    setSlides(next);
    setSelected(target);
  }
  function updateTable(table: TableData, group?: string) {
    const id = slides[selected].id;
    setSlides(
      (items) =>
        items.map((s) =>
          s.id === id
            ? {
                ...s,
                table,
                citationReview: !!s.citations?.length || s.citationReview,
              }
            : s,
        ),
      group ? `data:${id}:${group}` : undefined,
    );
  }
  function updateChart(chart: ChartData, group?: string) {
    const id = slides[selected].id;
    setSlides(
      (items) =>
        items.map((s) =>
          s.id === id
            ? {
                ...s,
                chart,
                citationReview: !!s.citations?.length || s.citationReview,
              }
            : s,
        ),
      group ? `data:${id}:${group}` : undefined,
    );
  }
  function updateNotes(value: string) {
    const id = slides[selected].id;
    setSlides(
      (items) => items.map((s) => (s.id === id ? { ...s, notes: value } : s)),
      `notes:${id}`,
    );
  }
  function insertBlock(kind: BlockKind) {
    if (slides.length >= 80) return;
    const block = createBlock(kind);
    setSlides((items) => [
      ...items.slice(0, selected + 1),
      block,
      ...items.slice(selected + 1),
    ]);
    setSelected(selected + 1);
    setBlocksOpen(false);
  }
  function startManual() {
    if (!topic.trim()) {
      setToast("Əvvəlcə təqdimatın mövzusunu yaz.");
      document.getElementById("topic")?.focus();
      return;
    }
    if (!slides.length) {
      history.replace({
        theme,
        slides: createManualDeck(topic, brief),
        design,
      });
      setTopic(topic.trim());
      setSelected(0);
    }
    setStep(3);
    setBlocksOpen(true);
  }
  function updateComparison(comparison: ComparisonData, group?: string) {
    const id = slides[selected].id;
    setSlides(
      (items) =>
        items.map((s) =>
          s.id === id
            ? {
                ...s,
                comparison,
                citationReview: !!s.citations?.length || s.citationReview,
              }
            : s,
        ),
      group ? `visual:${id}:${group}` : undefined,
    );
  }
  function updateTimeline(timeline: TimelineData, group?: string) {
    const id = slides[selected].id;
    setSlides(
      (items) =>
        items.map((s) =>
          s.id === id
            ? {
                ...s,
                timeline,
                citationReview: !!s.citations?.length || s.citationReview,
              }
            : s,
        ),
      group ? `visual:${id}:${group}` : undefined,
    );
  }
  function updateImage(image: ImageAsset | undefined, group?: string) {
    const id = slides[selected].id;
    const next = slides.map((s) =>
      s.id === id
        ? {
            ...s,
            image,
            citationReview: !!s.citations?.length || s.citationReview,
          }
        : s,
    );
    if (projectImageSize(next) > PROJECT_IMAGE_LIMIT) {
      setToast(
        "Layihə üçün şəkil yaddaşı limiti dolub. Digər şəkillərdən birini çıxar.",
      );
      return false;
    }
    setSlides(next, group ? `image:${id}:${group}` : undefined);
    return true;
  }
  function addCurrent() {
    if (slides.length >= 80) return;
    setSlides((items) => [
      ...items.slice(0, selected + 1),
      {
        id: uid(),
        title: "Yeni slayd",
        body: "Mətnini buraya yaz.",
        layout: "text",
      },
      ...items.slice(selected + 1),
    ]);
    setSelected(selected + 1);
  }
  function deleteCurrent() {
    if (slides.length <= 2) return;
    setSlides((items) => items.filter((_, i) => i !== selected));
    setSelected(Math.min(selected, slides.length - 2));
    setToast("Slayd çıxarıldı. “Geri al” ilə bərpa edə bilərsən.");
  }
  function backupCurrent() {
    try {
      downloadBackup(currentProject());
      setToast(
        "Ehtiyat nüsxə hazırdır. Təqdimatlarım bölməsindən yenidən aça bilərsən.",
      );
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "Ehtiyat nüsxə hazırlanmadı.",
      );
    }
  }
  function importProject(p: Project) {
    const copy = { ...p, id: uid(), updatedAt: new Date().toISOString() };
    return persist([copy, ...projects]);
  }
  function cloneProject(p: Project) {
    if (
      persist([
        {
          ...p,
          id: uid(),
          topic: `${p.topic.slice(0, 150)} (surət)`,
          updatedAt: new Date().toISOString(),
        },
        ...projects,
      ])
    )
      setToast("Təqdimatın ayrıca surəti yaradıldı.");
  }
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        presenting ||
        practicing ||
        blocksOpen ||
        outlineOpen ||
        replaceOpen ||
        agendaOpen ||
        galleryOpen ||
        help ||
        deleteId ||
        pendingAction ||
        page !== "create" ||
        step < 2
      )
        return;
      const target = event.target as HTMLElement | null;
      const editing =
        target instanceof HTMLElement &&
        !!target.closest('input,textarea,select,[contenteditable="true"]');
      const command = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (command && key === "s") {
        event.preventDefault();
        save();
        return;
      }
      if (command && key === "z" && !editing) {
        event.preventDefault();
        if (event.shiftKey) history.redo();
        else history.undo();
        return;
      }
      if (command && key === "y" && !editing) {
        event.preventDefault();
        history.redo();
        return;
      }
      if (editing || step !== 3) return;
      if (!command && !event.altKey && (key === "home" || key === "end")) {
        event.preventDefault();
        setSelected(key === "home" ? 0 : slides.length - 1);
      }
      if (command && key === "d") {
        event.preventDefault();
        duplicateCurrent();
      }
      if (!command && !event.altKey && key === "arrowright") {
        event.preventDefault();
        setSelected(Math.min(slides.length - 1, selected + 1));
      }
      if (!command && !event.altKey && key === "arrowleft") {
        event.preventDefault();
        setSelected(Math.max(0, selected - 1));
      }
      if (!command && !event.repeat && key === "delete") {
        event.preventDefault();
        deleteCurrent();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
  async function download() {
    setExporting(true);
    try {
      await exportPptx(currentProject());
      setToast("PowerPoint faylı hazırdır.");
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Yükləmə alınmadı. Yenidən cəhd et.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      {pendingAction && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="replace-draft-title"
          >
            <h2 id="replace-draft-title">Cari işini saxlamısan?</h2>
            <p>
              Bu qaralama yenisi ilə əvəz olunacaq. Hazır slaydların varsa,
              əvvəlcə “Saxla” düyməsi ilə Təqdimatlarım bölməsinə əlavə edə
              bilərsən.
            </p>
            <div className="panel-footer">
              <button
                className="secondary"
                autoFocus
                onClick={() => setPendingAction(null)}
              >
                Geri qayıt
              </button>
              <button
                className="primary"
                onClick={() => {
                  if (pendingAction === "new") reset(true);
                  else if (pendingAction === "rebuild") generatePlan();
                  else load(pendingAction, true);
                  setPendingAction(null);
                }}
              >
                Davam et
              </button>
            </div>
          </section>
        </div>
      )}
      <div className="app-shell">
        <aside className="sidebar">
          <a
            href="#"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              setPage("create");
            }}
            aria-label="Təqdim ana səhifə"
          >
            <span className="brand-mark">
              t<span>·</span>
            </span>
            Təqdim<span className="beta">BETA</span>
          </a>
          <button className="new-button" onClick={() => reset()}>
            <Plus size={18} /> Yeni təqdimat
          </button>
          <div className="nav-label">İŞ MƏKANIN</div>
          <nav>
            <button
              className={page === "create" ? "active" : ""}
              onClick={() => setPage("create")}
            >
              <LayoutGrid size={18} />
              Təqdimat hazırla
              <span className="nav-dot" />
            </button>
            <button
              className={page === "projects" ? "active" : ""}
              onClick={() => setPage("projects")}
            >
              <FolderOpen size={18} />
              Təqdimatlarım<span className="nav-count">{projects.length}</span>
            </button>
            <button onClick={() => setHelp(true)}>
              <BookOpen size={18} />
              Qısa bələdçi
              <ArrowRight size={15} className="nav-end" />
            </button>
          </nav>
          <div className="sidebar-note">
            <div className="note-icon">
              <GraduationCap size={23} />
            </div>
            <strong>
              Fikrin səndən,
              <br />
              təqdimatı bizdən.
            </strong>
            <p>
              Azərbaycan dilində düşün.
              <br />
              İnamla təqdim et.
            </p>
            <span className="note-line" />
          </div>
          <div className="sidebar-footer">
            <img
              className="aic-brand-icon"
              src="/brand/aic-logo.svg"
              alt="AIC loqosu"
              width="34"
              height="34"
            />
            <div>
              AIC tərəfindən hazırlanıb<small>Öyrən. Qur. Paylaş.</small>
            </div>
          </div>
        </aside>

        <main>
          <header className="topbar">
            <div className="breadcrumb">
              İş məkanı <ChevronRight size={14} />
              <span>
                {page === "projects" ? "Təqdimatlarım" : "Yeni təqdimat"}
              </span>
            </div>
            <div className="top-right">
              <button
                type="button"
                className="color-mode-toggle"
                onClick={() => setDarkMode((value) => !value)}
                aria-pressed={darkMode}
                aria-label={
                  darkMode ? "Açıq rejimə keç" : "Qaranlıq rejimə keç"
                }
                title={darkMode ? "Açıq rejimə keç" : "Qaranlıq rejimə keç"}
              >
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <span className={`draft-status ${draftStatus}`} role="status">
                <span />
                {draftStatus === "saving"
                  ? "Saxlanır…"
                  : draftStatus === "error"
                    ? "Qaralama saxlanmadı"
                    : "Qaralama saxlanıldı"}
              </span>
              <span className="avatar" title="Yerli iş məkanı">
                T
              </span>
            </div>
          </header>
          {page === "projects" ? (
            <ProjectLibrary
              projects={projects}
              onOpen={load}
              onDelete={setDeleteId}
              onNew={() => reset()}
              onImport={importProject}
              onClone={cloneProject}
            />
          ) : (
            <section className="workspace">
              <div className="page-title">
                <div className="eyebrow">
                  <span /> FİKRİNDƏN İLK SLAYDA
                </div>
                <h1>
                  Böyük fikirlər, <em>aydın təqdimatlar.</em>
                </h1>
                <p>
                  Mövzunu seç. Öz üslubunu tap. Azərbaycan dilində təqdim et.
                </p>
              </div>
              <div className="steps">
                {[
                  "Mövzu və material",
                  "Təqdimat planı",
                  "Dizayn və yükləmə",
                ].map((label, i) => (
                  <div
                    className={`step ${step === i + 1 ? "current" : ""} ${step > i + 1 ? "done" : ""}`}
                    key={label}
                  >
                    <span>
                      {step > i + 1 ? <Check size={14} /> : `0${i + 1}`}
                    </span>
                    <strong>{label}</strong>
                    {i < 2 && <div className="step-line" />}
                  </div>
                ))}
              </div>

              {step > 1 && (
                <div className="history-toolbar">
                  <div>
                    <button
                      className="secondary"
                      onClick={history.undo}
                      disabled={!history.canUndo}
                      title="Slayd və dizayn dəyişikliklərini geri al · Ctrl+Z"
                    >
                      <Undo2 size={15} />
                      Geri al
                    </button>
                    <button
                      className="secondary"
                      onClick={history.redo}
                      disabled={!history.canRedo}
                      title="Yenidən et · Ctrl+Shift+Z"
                    >
                      <Redo2 size={15} />
                      Yenidən et
                    </button>
                  </div>
                  <button className="text-button" onClick={() => setHelp(true)}>
                    <Keyboard size={15} />
                    Qısayollar
                  </button>
                </div>
              )}
              {step === 1 && !!slides.length && (
                <div className="return-to-deck">
                  <span>
                    Hazır slaydların saxlanılır. Yeni plan onları əvəz edəcək.
                  </span>
                  <button className="secondary" onClick={() => setStep(3)}>
                    Hazır slaydlara qayıt
                  </button>
                </div>
              )}
              {step === 1 ? (
                <div className="creation-grid">
                  <form className="panel form-panel" onSubmit={build}>
                    <div className="panel-heading">
                      <div className="panel-icon">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h2>Hər şey bir mövzu ilə başlayır</h2>
                        <p>Nə haqqında danışmaq istəyirsən?</p>
                      </div>
                      <span className="tiny-tag">01</span>
                    </div>
                    <label htmlFor="topic">
                      Təqdimatın mövzusu <span>*</span>
                    </label>
                    <textarea
                      id="topic"
                      className="topic-input"
                      placeholder="Məsələn, süni intellektin təhsildə rolu"
                      value={topic}
                      onChange={(e) =>
                        // A topic is one line: it becomes the cover title and file name.
                        setTopic(e.target.value.replace(/\s*[\r\n]+\s*/g, " "))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.preventDefault();
                      }}
                      maxLength={160}
                      required
                    />
                    <div className="input-bottom">
                      <span>Aydın mövzu, daha yaxşı başlanğıc.</span>
                      <span>{topic.length}/160</span>
                    </div>
                    <div className="field-row">
                      <div>
                        <label htmlFor="subject">Fənn və ya sahə</label>
                        <input
                          id="subject"
                          placeholder="Məsələn, İnformatika"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          maxLength={70}
                        />
                      </div>
                      <div>
                        <label htmlFor="author">Hazırlayan</label>
                        <input
                          id="author"
                          placeholder="Adın və soyadın"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          maxLength={90}
                        />
                      </div>
                    </div>
                    <BriefForm value={brief} onChange={setBrief} />
                    <PdfUpload
                      references={references}
                      onChange={setReferences}
                    />
                    <label htmlFor="material">
                      {references.length ? "Əlavə qeydlərin" : "Materialın"}{" "}
                      {!references.length && <span>*</span>}
                      <span className="label-hint">Abzaslarla ayır</span>
                    </label>
                    <textarea
                      id="material"
                      className="material-input"
                      placeholder="Qeydlərini və təqdimatda istifadə etmək istədiyin mətni buraya əlavə et…"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      maxLength={12000}
                      required={!references.length}
                    />
                    <div className="material-note">
                      <FileText size={13} />
                      Mətnin slaydlara bölünür. Başlıqları növbəti addımda
                      düzəldə bilərsən.
                    </div>
                    <div className="count-row">
                      <div>
                        <label htmlFor="count">Təxmini slayd sayı</label>
                        <span>Mətn uzundursa, oxunaqlılıq üçün artırılır</span>
                      </div>
                      <div className="counter">
                        <button
                          type="button"
                          onClick={() => setCount((c) => Math.max(4, c - 1))}
                          disabled={count <= 4}
                          aria-label="Slayd sayını azalt"
                        >
                          −
                        </button>
                        <output id="count">{count}</output>
                        <button
                          type="button"
                          onClick={() => setCount((c) => Math.min(12, c + 1))}
                          disabled={count >= 12}
                          aria-label="Slayd sayını artır"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button className="primary full" type="submit">
                      Planı hazırla <ArrowRight size={18} />
                    </button>
                    <button
                      type="button"
                      className="manual-start"
                      onClick={startManual}
                    >
                      Material olmadan özüm qurum <ArrowRight size={15} />
                    </button>
                    <p className="under-button">
                      <CheckCheck size={14} />
                      Qeydiyyat tələb olunmur · Materialın serverə göndərilmir
                    </p>
                  </form>
                  <div className="preview-column">
                    <div className="preview-heading">
                      <span>
                        <span className="live-dot" />
                        DİZAYNA İLK BAXIŞ
                      </span>
                      <span>16:9</span>
                    </div>
                    <div className="preview-frame">
                      <SlideView
                        slide={{
                          ...previewSlides[0],
                          title: topic.trim() || previewSlides[0].title,
                          body: brief.goal.trim() || previewSlides[0].body,
                        }}
                        index={0}
                        total={count}
                        theme={theme}
                        subject={subject || sample.subject}
                        author={author}
                        brief={brief}
                        design={design}
                      />
                    </div>
                    <div className="preview-caption">
                      <span>
                        <Presentation size={15} />
                        Sənin növbəti təqdimatın belə görünə bilər.
                      </span>
                      <MoreHorizontal size={19} />
                    </div>
                    <div className="theme-heading">
                      <h3>Öz üslubunu seç</h3>
                      <span>{themes.length} fərqli dizayn</span>
                    </div>
                    <button
                      className="secondary design-gallery-button"
                      onClick={() => setGalleryOpen(true)}
                    >
                      Dizayn qalereyasını aç
                    </button>
                    <div className="theme-options">
                      {themes.map((t) => (
                        <button
                          type="button"
                          key={t.id}
                          className={`theme-option ${theme === t.id ? "chosen" : ""}`}
                          onClick={() => setTheme(t.id)}
                          aria-pressed={theme === t.id}
                        >
                          <div className={`theme-swatch theme-${t.id}`}>
                            <span>
                              {t.id === "noir"
                                ? "↗"
                                : t.id === "blueprint"
                                  ? "+"
                                  : "Aa"}
                            </span>
                            <i />
                            <small>{t.category}</small>
                            <b>{theme === t.id && <Check size={12} />}</b>
                          </div>
                          <strong>{t.name}</strong>
                          <span>{t.note}</span>
                        </button>
                      ))}
                    </div>
                    <div className="sample-card">
                      <div>
                        <span className="sample-symbol">↗</span>
                        <h3>Əvvəlcə sınaqdan keçir</h3>
                        <p>Hazır nümunə ilə bütün addımlara bax.</p>
                      </div>
                      <button
                        onClick={() => {
                          setReferences([]);
                          setTopic(sample.topic);
                          setSubject(sample.subject);
                          setMaterial(sample.material);
                          setCount(6);
                          setToast(
                            "Nümunə əlavə edildi. “Planı hazırla” düyməsi ilə davam et.",
                          );
                        }}
                        aria-label="Nümunə materialı əlavə et"
                      >
                        <ArrowUp size={20} />
                      </button>
                    </div>
                    <div className="honest-note">
                      <span>İLKİN VERSİYA HAQQINDA</span>
                      <p>
                        Öz qeydlərini və ya PDF materiallarını əlavə et. Süni
                        intellektlə mətn və mənbə hazırlama növbəti mərhələdə
                        əlavə ediləcək.
                      </p>
                    </div>
                  </div>
                </div>
              ) : step === 2 ? (
                <div className="panel outline-panel">
                  <div className="section-heading">
                    <div>
                      <h2>Əvvəlcə fikirləri yerinə qoyaq.</h2>
                      <p>Başlıqları və məzmunu yoxla, sonra dizayna keç.</p>
                    </div>
                    <span className="tiny-tag">{slides.length} slayd</span>
                  </div>
                  <div className="outline-list">
                    {slides.map((s, i) => (
                      <div className="outline-item" key={s.id}>
                        <span className="outline-number">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="outline-fields">
                          <label className="sr-only" htmlFor={`title-${s.id}`}>
                            {i + 1}-ci slaydın başlığı
                          </label>
                          <input
                            id={`title-${s.id}`}
                            value={s.title}
                            onChange={(e) =>
                              updateSlide(s.id, "title", e.target.value)
                            }
                            maxLength={160}
                          />
                          <label className="sr-only" htmlFor={`body-${s.id}`}>
                            {i + 1}-ci slaydın mətni
                          </label>
                          <textarea
                            id={`body-${s.id}`}
                            value={s.body}
                            onChange={(e) =>
                              updateSlide(s.id, "body", e.target.value)
                            }
                            maxLength={3000}
                          />
                        </div>
                        <div className="outline-actions">
                          <button
                            className="icon-button"
                            aria-label="Yuxarı köçür"
                            onClick={() => moveSlide(i, -1)}
                            disabled={i === 0}
                          >
                            <ArrowUp size={15} />
                          </button>
                          <button
                            className="icon-button"
                            aria-label="Aşağı köçür"
                            onClick={() => moveSlide(i, 1)}
                            disabled={i === slides.length - 1}
                          >
                            <ArrowDown size={15} />
                          </button>
                          <button
                            className="icon-button danger"
                            aria-label="Slaydı sil"
                            onClick={() => {
                              setSlides((items) =>
                                items.filter((s2) => s2.id !== s.id),
                              );
                              setSelected(0);
                            }}
                            disabled={slides.length <= 2}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="text-button"
                    disabled={slides.length >= 80}
                    onClick={() =>
                      setSlides((s) => [
                        ...s,
                        {
                          id: uid(),
                          title: "Yeni slayd",
                          body: "Mətnini buraya yaz.",
                          layout: "text",
                        },
                      ])
                    }
                  >
                    <Plus size={16} />
                    Slayd əlavə et
                  </button>
                  <div className="panel-footer">
                    <button className="secondary" onClick={() => setStep(1)}>
                      <ArrowLeft size={16} />
                      Geri
                    </button>
                    <button
                      className="primary"
                      onClick={() => {
                        setStep(3);
                        setSelected(0);
                      }}
                    >
                      Dizayna keç
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="editor">
                  <div className="editor-toolbar">
                    <button className="text-button" onClick={() => setStep(2)}>
                      <ArrowLeft size={16} />
                      Planı düzəlt
                    </button>
                    <div>
                      <button className="secondary" onClick={save}>
                        <Save size={16} />
                        Saxla
                      </button>
                      <button
                        className="secondary"
                        onClick={backupCurrent}
                        title="Son redaktələr daxil olmaqla layihə faylını yüklə"
                      >
                        <Download size={16} />
                        Ehtiyat nüsxə
                      </button>
                      <button
                        className="secondary"
                        onClick={() => setPracticing(true)}
                      >
                        <Timer size={16} />
                        Məşq et
                      </button>
                      <button
                        className="secondary"
                        onClick={() => setPresenting(true)}
                      >
                        <MonitorPlay size={16} />
                        Təqdim et
                      </button>
                      <button
                        className="primary"
                        onClick={download}
                        disabled={exporting}
                      >
                        {exporting ? (
                          <Loader2 className="spin" size={16} />
                        ) : (
                          <Download size={16} />
                        )}
                        PowerPoint
                      </button>
                    </div>
                  </div>
                  <div className="editor-grid">
                    <SlideNavigator
                      key={projectId}
                      project={currentProject()}
                      selected={selected}
                      onSelect={setSelected}
                    />
                    <div className="editor-center">
                      <SlideView
                        slide={slides[selected]}
                        index={selected}
                        total={slides.length}
                        theme={theme}
                        subject={subject}
                        author={author}
                        brief={brief}
                        design={design}
                      />
                      <div className="slide-navigation">
                        <button
                          className="icon-button"
                          onClick={() => setSelected(selected - 1)}
                          disabled={selected === 0}
                          aria-label="Əvvəlki slayd"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <span>
                          {selected + 1} / {slides.length}
                        </span>
                        <button
                          className="icon-button"
                          onClick={() => setSelected(selected + 1)}
                          disabled={selected === slides.length - 1}
                          aria-label="Növbəti slayd"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                      <SlideJump
                        total={slides.length}
                        selected={selected}
                        onSelect={setSelected}
                      />
                      <p className="slide-statistics">
                        {slideStats(slides[selected]).words} söz · təxminən{" "}
                        {slideStats(slides[selected]).seconds} saniyə oxuma ·
                        110 söz/dəq hesabı
                      </p>
                      <div className="slide-manage">
                        <button
                          className="text-button"
                          onClick={addCurrent}
                          disabled={slides.length >= 80}
                        >
                          <Plus size={14} />
                          Slayd əlavə et
                        </button>
                        <div>
                          <button
                            className="icon-button"
                            onClick={() => moveSlide(selected, -1)}
                            disabled={selected === 0}
                            aria-label="Seçilən slaydı yuxarı köçür"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            className="icon-button"
                            onClick={() => moveSlide(selected, 1)}
                            disabled={selected === slides.length - 1}
                            aria-label="Seçilən slaydı aşağı köçür"
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            className="icon-button danger"
                            onClick={deleteCurrent}
                            disabled={slides.length <= 2}
                            aria-label="Seçilən slaydı çıxar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="block-open-button"
                        disabled={slides.length >= 80}
                        onClick={() => setBlocksOpen(true)}
                      >
                        <Plus size={16} />
                        Hazır slayd bloku seç <ArrowRight size={16} />
                      </button>
                      <div className="edit-fields">
                        <div className="slide-edit-toolbar">
                          <span className="layout-label">Slaydın düzülüşü</span>
                          <div>
                            <button
                              type="button"
                              className="text-button"
                              onClick={splitCurrent}
                              disabled={
                                slides[selected].body.length <= BODY_LIMIT ||
                                [
                                  "table",
                                  "chart",
                                  "comparison",
                                  "timeline",
                                  "image",
                                ].includes(slides[selected].layout || "")
                              }
                              title="Uzun mətni bir neçə slayda böl"
                            >
                              <Scissors size={14} />
                              Böl
                            </button>
                            <button
                              type="button"
                              className="text-button"
                              onClick={duplicateCurrent}
                              disabled={slides.length >= 80}
                            >
                              <Copy size={14} />
                              Surətini yarat
                            </button>
                          </div>
                        </div>
                        <div className="layout-picker">
                          {layouts.map((l) => (
                            <button
                              type="button"
                              key={l.id}
                              className={
                                layoutFor(slides[selected], selected) === l.id
                                  ? "chosen"
                                  : ""
                              }
                              aria-pressed={
                                layoutFor(slides[selected], selected) === l.id
                              }
                              title={l.detail}
                              onClick={() =>
                                setSlides((items) =>
                                  items.map((s) =>
                                    s.id === slides[selected].id
                                      ? {
                                          ...s,
                                          layout: l.id,
                                          comparison:
                                            l.id === "comparison"
                                              ? s.comparison ||
                                                emptyComparison()
                                              : s.comparison,
                                          timeline:
                                            l.id === "timeline"
                                              ? s.timeline || emptyTimeline()
                                              : s.timeline,
                                          table:
                                            l.id === "table"
                                              ? s.table || emptyTable()
                                              : s.table,
                                          chart:
                                            l.id === "chart"
                                              ? s.chart || emptyChart()
                                              : s.chart,
                                        }
                                      : s,
                                  ),
                                )
                              }
                            >
                              <span
                                className={`layout-glyph glyph-${l.id}`}
                                aria-hidden="true"
                              >
                                <i />
                                <i />
                                <i />
                              </span>
                              {l.name}
                            </button>
                          ))}
                        </div>
                        {!!slides[selected].citations?.length && (
                          <div className="editor-citations">
                            <FileText size={14} />
                            <span>
                              <b>Bu slaydın material mənbələri</b>
                              {citationLabel(slides[selected].citations)}
                              <small>
                                Mətni dəyişsən, istinadın uyğunluğunu yenidən
                                yoxla.
                              </small>
                              {slides[selected].citationReview && (
                                <button
                                  type="button"
                                  className="text-button"
                                  onClick={() =>
                                    setSlides((items) =>
                                      items.map((s) =>
                                        s.id === slides[selected].id
                                          ? { ...s, citationReview: false }
                                          : s,
                                      ),
                                    )
                                  }
                                >
                                  <Check size={13} />
                                  İstinadı yoxladım
                                </button>
                              )}
                            </span>
                          </div>
                        )}
                        <label htmlFor="edit-title">Slaydın başlığı</label>
                        <input
                          id="edit-title"
                          value={slides[selected].title}
                          maxLength={160}
                          onChange={(e) =>
                            updateSlide(
                              slides[selected].id,
                              "title",
                              e.target.value,
                            )
                          }
                        />
                        <VisualEditor
                          key={`${projectId}:${slides[selected].id}`}
                          slide={slides[selected]}
                          onComparison={updateComparison}
                          onTimeline={updateTimeline}
                          onImage={updateImage}
                        />
                        <DataEditor
                          key={slides[selected].id}
                          slide={slides[selected]}
                          onTable={updateTable}
                          onChart={updateChart}
                        />
                        <label htmlFor="edit-body">
                          {[
                            "table",
                            "chart",
                            "comparison",
                            "timeline",
                            "image",
                          ].includes(slides[selected].layout || "")
                            ? "Açıqlama (istəyə bağlı)"
                            : "Mətn"}
                        </label>
                        <textarea
                          id="edit-body"
                          maxLength={3000}
                          value={slides[selected].body}
                          onChange={(e) =>
                            updateSlide(
                              slides[selected].id,
                              "body",
                              e.target.value,
                            )
                          }
                        />
                        {slides[selected].body.length >
                          ([
                            "table",
                            "chart",
                            "comparison",
                            "timeline",
                            "image",
                          ].includes(slides[selected].layout || "")
                            ? 160
                            : BODY_LIMIT) && (
                          <p className="warning">
                            {[
                              "table",
                              "chart",
                              "comparison",
                              "timeline",
                              "image",
                            ].includes(slides[selected].layout || "")
                              ? "Açıqlamanı 160 simvola qədər qısalt. Bu düzülüşdəki slaydlar avtomatik bölünmür."
                              : "Mətn uzundur. “Böl” düyməsi ilə ayrıca slaydlara ayıra bilərsən."}
                          </p>
                        )}
                        <label htmlFor="speaker-notes">
                          Çıxış qeydləri{" "}
                          <span className="label-hint">Slaydda görünmür</span>
                        </label>
                        <textarea
                          id="speaker-notes"
                          aria-describedby="notes-count"
                          className="speaker-notes"
                          value={slides[selected].notes || ""}
                          maxLength={8000}
                          placeholder="Bu slaydı izah edərkən demək istədiklərini yaz…"
                          onChange={(e) => updateNotes(e.target.value)}
                        />
                        <small id="notes-count" className="notes-count">
                          {(slides[selected].notes || "").length} / 8000 simvol
                        </small>
                        <p className="notes-hint">
                          Qeydlər PowerPoint-in çıxış qeydlərinə əlavə edilir.
                        </p>
                      </div>
                      <SourceInspector
                        key={projectId}
                        slide={slides[selected]}
                        references={references}
                        onEditMaterial={() => setStep(1)}
                        onChange={(citations) => {
                          const id = slides[selected].id;
                          setSlides((items) =>
                            items.map((s) =>
                              s.id === id
                                ? {
                                    ...s,
                                    citations,
                                    citationReview: citations.length > 0,
                                  }
                                : s,
                            ),
                          );
                        }}
                      />
                      <QualityPanel
                        slides={slides}
                        references={references}
                        brief={brief}
                        design={design}
                        onSelect={(index) => {
                          setSelected(index);
                          document
                            .querySelector(".editor-center")
                            ?.scrollIntoView?.({
                              behavior: "smooth",
                              block: "start",
                            });
                        }}
                      />
                    </div>
                    <aside className="design-panel">
                      <h3>Dizayn</h3>
                      <p>Bütün slaydlara tətbiq olunur</p>
                      <button
                        className="secondary full design-gallery-button"
                        onClick={() => setGalleryOpen(true)}
                      >
                        Dizayn qalereyasını aç
                      </button>
                      {themes.map((t) => (
                        <button
                          key={t.id}
                          className={`design-choice ${theme === t.id ? "chosen" : ""}`}
                          onClick={() => setTheme(t.id)}
                          aria-pressed={theme === t.id}
                        >
                          <span className={`theme-chip theme-${t.id}`} />
                          {t.name}
                          {theme === t.id && <Check size={15} />}
                        </button>
                      ))}
                      <DesignControls design={design} onChange={setDesign} />
                      <div
                        className="text-export-tools"
                        aria-label="Mətn ixracı və plan idxalı"
                      >
                        <strong>Mətnlə işləmək</strong>
                        <button
                          className="secondary full"
                          onClick={() => setReplaceOpen(true)}
                        >
                          Mətni tap və əvəzlə
                        </button>
                        <button
                          className="secondary full"
                          onClick={() => setAgendaOpen(true)}
                          disabled={slides.length >= 80}
                        >
                          Başlıqlardan plan slaydı
                        </button>
                        <button
                          className="secondary full"
                          onClick={() => setOutlineOpen(true)}
                          disabled={slides.length >= 80}
                        >
                          Plan mətni əlavə et
                        </button>
                        <button
                          className="text-button"
                          onClick={() =>
                            downloadText(
                              topic,
                              "plan",
                              outlineMarkdown(currentProject()),
                              true,
                            )
                          }
                        >
                          Planı Markdown kimi yüklə
                        </button>
                        <button
                          className="text-button"
                          onClick={() =>
                            downloadText(
                              topic,
                              "qeydler",
                              speakerText(currentProject()),
                            )
                          }
                        >
                          Çıxış qeydlərini yüklə
                        </button>
                        <button
                          className="text-button"
                          onClick={() =>
                            downloadText(
                              topic,
                              `slayd-${selected + 1}`,
                              slideText(slides[selected]),
                            )
                          }
                        >
                          Bu slaydın mətnini yüklə
                        </button>
                      </div>
                      <div className="export-note">
                        <FileText size={20} />
                        <strong>PDF lazımdır?</strong>
                        <p>Çap pəncərəsində “PDF kimi saxla” seç.</p>
                        <button
                          className="secondary full"
                          onClick={() => window.print()}
                        >
                          Çap / PDF
                        </button>
                      </div>
                      <p className="local-note">
                        Qaralama avtomatik bərpa edilir. “Saxla” onu
                        Təqdimatlarım bölməsinə əlavə edir. Başqa brauzerdə və
                        ya kompüterdə açmaq üçün “Ehtiyat nüsxə” faylını yüklə.
                      </p>
                    </aside>
                  </div>
                </div>
              )}
              <footer className="workspace-footer">
                <span>Azərbaycanca düşünülüb. Sənin üçün hazırlanıb.</span>
                <span>
                  Təqdim <i>×</i> AIC{" "}
                  <img
                    className="aic-footer-icon"
                    src="/brand/aic-logo.svg"
                    alt="AIC loqosu"
                    width="20"
                    height="20"
                  />
                </span>
              </footer>
            </section>
          )}
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCheck size={18} />
          {toast}
          <button onClick={() => setToast("")} aria-label="Bildirişi bağla">
            <X size={16} />
          </button>
        </div>
      )}
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              autoFocus
              onClick={() => setHelp(false)}
              aria-label="Bağla"
            >
              <X size={20} />
            </button>
            <BookOpen size={28} />
            <h2 id="help-title">İlk təqdimatına üç addım</h2>
            <p>
              <b>01. Materialını əlavə et.</b> Mövzunu və qeydlərini yaz və ya
              PDF əlavə et. İstifadə edəcəyin səhifələri seç. Mətn slaydlara
              bölünür, PDF adı və səhifələr mənbə kimi göstərilir.
            </p>
            <p>
              <b>02. Planı yoxla.</b> Başlıqları və mətnləri redaktə et,
              ardıcıllığı dəyiş.
            </p>
            <p>
              <b>03. Təqdim et.</b> Dizaynı seç, PowerPoint faylını yüklə və ya
              PDF kimi çap et.
            </p>
            <div className="shortcut-list">
              <h3>Klaviatura qısayolları</h3>
              <p>
                <kbd>Ctrl / ⌘ + S</kbd>
                <span>Təqdimatı saxla</span>
              </p>
              <p>
                <kbd>Ctrl / ⌘ + Z</kbd>
                <span>Geri al</span>
              </p>
              <p>
                <kbd>Ctrl / ⌘ + Shift + Z</kbd>
                <span>Yenidən et</span>
              </p>
              <p>
                <kbd>Ctrl / ⌘ + D</kbd>
                <span>Seçilən slaydın surəti</span>
              </p>
              <p>
                <kbd>← / →</kbd>
                <span>
                  Slaydlar arasında keçid · Home/End ilk/son slayda keçir
                </span>
              </p>
              <p>
                <kbd>Delete</kbd>
                <span>Seçilən slaydı çıxar</span>
              </p>
              <small>
                Mətn sahəsində yazarkən redaktorun qısayolları yazıya mane
                olmur.
              </small>
            </div>
            <div className="info-box">
              Bu, yerli ilkin versiyadır. Hesab, ödəniş və süni intellekt
              bağlantısı hələ əlavə edilməyib. Məlumatlar yalnız brauzer
              yaddaşında saxlanır.
            </div>
          </section>
        </div>
      )}
      {deleteId && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="modal"
          >
            <h2 id="delete-title">Təqdimat silinsin?</h2>
            <p>
              Bu brauzerdə saxlanmış nüsxə silinəcək. Yüklədiyin fayllar
              qalacaq.
            </p>
            <div className="panel-footer">
              <button
                className="secondary"
                autoFocus
                onClick={() => setDeleteId(null)}
              >
                İmtina et
              </button>
              <button
                className="primary"
                onClick={() => {
                  if (persist(projects.filter((p) => p.id !== deleteId)))
                    setDeleteId(null);
                }}
              >
                Sil
              </button>
            </div>
          </section>
        </div>
      )}
      {presenting && (
        <div
          className="presentation-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Slayd təqdimatı"
        >
          <button
            className="presentation-close secondary"
            autoFocus
            onClick={() => setPresenting(false)}
          >
            <X size={17} />
            Bağla · Esc
          </button>
          <SlideView
            slide={slides[selected]}
            index={selected}
            total={slides.length}
            theme={theme}
            subject={subject}
            author={author}
            brief={brief}
            design={design}
          />
          <div className="presentation-controls">
            <button
              className="secondary"
              disabled={selected === 0}
              onClick={() => setSelected(selected - 1)}
            >
              <ChevronLeft size={20} />
              Əvvəlki
            </button>
            <span>
              {selected + 1} / {slides.length}
            </span>
            <button
              className="secondary"
              disabled={selected === slides.length - 1}
              onClick={() => setSelected(selected + 1)}
            >
              Növbəti
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
      {practicing && (
        <PracticeMode
          project={currentProject()}
          selected={selected}
          onSelect={setSelected}
          onClose={() => setPracticing(false)}
        />
      )}
      {galleryOpen && (
        <DesignGallery
          project={{
            ...currentProject(),
            slides: slides.length
              ? slides
              : [
                  {
                    ...previewSlides[0],
                    title: topic.trim() || previewSlides[0].title,
                    body: brief.goal.trim() || previewSlides[0].body,
                  },
                ],
          }}
          selected={slides.length ? selected : 0}
          onClose={() => setGalleryOpen(false)}
          onApply={setTheme}
        />
      )}
      {replaceOpen && (
        <ReplaceDialog
          slides={slides}
          selected={selected}
          onClose={() => setReplaceOpen(false)}
          onApply={(result) => {
            if (result.error || !result.count) return;
            setSlides(result.slides);
            setSelected(result.changes[0].index);
            setToast(
              `${result.count} əvəzləmə tətbiq edildi. “Geri al” ilə bərpa edə bilərsən.`,
            );
          }}
        />
      )}
      {agendaOpen && (
        <AgendaBuilder
          slides={slides}
          onClose={() => setAgendaOpen(false)}
          onInsert={(items) => {
            if (!items.length || slides.length + items.length > 80) {
              setToast("Layihədə ən çox 80 slayd ola bilər.");
              return false;
            }
            const position = layoutFor(slides[0], 0) === "cover" ? 1 : 0;
            setSlides([
              ...slides.slice(0, position),
              ...items,
              ...slides.slice(position),
            ]);
            setSelected(position);
            setToast(
              "Plan slaydları əlavə edildi. Başlıqlar dəyişsə, planı ayrıca redaktə et.",
            );
            return true;
          }}
        />
      )}
      {outlineOpen && (
        <OutlineImport
          remaining={80 - slides.length}
          onClose={() => setOutlineOpen(false)}
          onAppend={(items) => {
            if (!items.length || slides.length + items.length > 80) {
              setToast("Layihədə ən çox 80 slayd ola bilər.");
              return false;
            }
            setSlides([...slides, ...items]);
            setSelected(slides.length);
            setToast(
              `${items.length} slayd əlavə edildi. “Geri al” ilə bərpa edə bilərsən.`,
            );
            return true;
          }}
        />
      )}
      <SlideBlocks
        open={blocksOpen}
        disabled={slides.length >= 80}
        onClose={() => setBlocksOpen(false)}
        onInsert={insertBlock}
      />
      <div className="print-slides">
        {slides.map((s, i) => (
          <SlideView
            key={s.id}
            slide={s}
            index={i}
            total={slides.length}
            theme={theme}
            subject={subject}
            author={author}
            brief={brief}
            design={design}
          />
        ))}
      </div>
    </>
  );
}
