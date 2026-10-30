import { useEffect, useState } from "react";
import { Draft, DRAFT_KEY } from "./storage";

export function useDraft(draft: Draft) {
  const [status, setStatus] = useState<"saving" | "saved" | "error">("saving");
  const serialized = JSON.stringify({
    ...draft,
    project: { ...draft.project, updatedAt: "" },
  });
  useEffect(() => {
    setStatus("saving");
    function flush() {
      try {
        const value = JSON.parse(serialized) as Draft;
        value.project.updatedAt = new Date().toISOString();
        localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
        setStatus("saved");
        return true;
      } catch {
        setStatus("error");
        return false;
      }
    }
    const timer = setTimeout(flush, 650);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!flush()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [serialized]);
  return status;
}
