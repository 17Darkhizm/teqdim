import { useEffect, useRef } from "react";

export function useDialogKeyboard(open: boolean, onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;
  const lastOutside = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const remember = () => {
      const target = document.activeElement;
      if (target instanceof HTMLElement && !target.closest('[role="dialog"]'))
        lastOutside.current = target;
    };
    remember();
    document.addEventListener("focusin", remember);
    return () => document.removeEventListener("focusin", remember);
  }, []);
  useEffect(() => {
    if (!open) return;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    const previous = lastOutside.current;
    const focusable = () =>
      [
        ...dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]',
        ),
      ].filter((item) => !item.closest('[hidden],[aria-hidden="true"]'));
    if (!dialog.contains(document.activeElement)) focusable()[0]?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable(),
        first = items[0],
        last = items.at(-1);
      if (!first) {
        event.preventDefault();
        return;
      }
      if (
        !dialog.contains(document.activeElement) ||
        (!event.shiftKey && document.activeElement === last)
      ) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => {
      window.removeEventListener("keydown", handler, true);
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);
}
