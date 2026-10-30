import {
  getDocument,
  GlobalWorkerOptions,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import type { PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { Reference } from "./model";
GlobalWorkerOptions.workerSrc = workerUrl;
export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export function validatePdfFile(file: Pick<File, "name" | "size">) {
  if (!/\.pdf$/i.test(file.name)) throw new Error("Yalnız PDF faylı seç.");
  if (file.size > MAX_FILE_SIZE) throw new Error("PDF ən çox 20 MB ola bilər.");
  if (file.size === 0) throw new Error("Fayl boşdur. Başqa PDF seç.");
}
export async function openPdf(file: File): Promise<PDFDocumentProxy> {
  validatePdfFile(file);
  const data = new Uint8Array(await file.arrayBuffer());
  const header = new TextDecoder().decode(data.subarray(0, 1024));
  if (!header.includes("%PDF-")) throw new Error("Bu fayl etibarlı PDF deyil.");
  const task = getDocument({ data, useSystemFonts: true });
  try {
    return await task.promise;
  } catch (error) {
    await task.destroy();
    if (error instanceof Error && error.name === "PasswordException")
      throw new Error("PDF parolla qorunur. Parolsuz nüsxəsini seç.");
    throw new Error("PDF oxunmadı. Faylın zədələnmədiyini yoxla.");
  }
}
export async function readPdfPages(
  doc: Pick<PDFDocumentProxy, "numPages" | "getPage">,
  from: number,
  to: number,
  onProgress: (page: number) => void,
) {
  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from < 1 ||
    to < from ||
    to > doc.numPages
  )
    throw new Error("Səhifə aralığını düzgün seç.");
  if (to - from + 1 > 50) throw new Error("Bir dəfəyə ən çox 50 səhifə seç.");
  const pages: Reference["pages"] = [];
  let length = 0;
  for (let n = from; n <= to; n++) {
    const page = await doc.getPage(n);
    try {
      const content = await page.getTextContent();
      let text = "";
      let previousY: number | undefined;
      let previousHeight = 0;
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const y = item.transform[5];
        if (
          previousY !== undefined &&
          Math.abs(y - previousY) > Math.max(previousHeight * 1.8, 18)
        )
          text += "\n\n";
        text += item.str + (item.hasEOL ? "\n" : " ");
        previousY = y;
        previousHeight = Math.abs(item.height);
      }
      text = text
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      length += text.length;
      if (length > 60000)
        throw new Error(
          "Seçilən mətn çox uzundur. Daha az səhifə seç (ən çox 60 000 simvol).",
        );
      pages.push({ number: n, text });
      onProgress(n);
    } finally {
      page.cleanup();
    }
  }
  if (!pages.some((p) => p.text.trim().length > 0))
    throw new Error(
      "Bu səhifələrdə oxuna bilən mətn tapılmadı. Skan PDF-lər üçün OCR hələ dəstəklənmir.",
    );
  return pages;
}
