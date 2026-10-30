import type JSZip from "jszip";
import type { Reference } from "./model";

const plainExtensions = ["txt", "text", "md", "markdown", "rst", "adoc", "tex", "log", "csv", "tsv", "json", "yaml", "yml", "org", "srt", "vtt", "ini", "cfg"];
const richExtensions = ["docx", "odt", "rtf", "html", "htm", "xml"];
export const DOCUMENT_ACCEPT = [...plainExtensions, ...richExtensions, "pdf"].map(ext => `.${ext}`).join(",") + ",text/*";
export const DOCUMENT_FORMATS = "PDF, DOCX, ODT, RTF, TXT, Markdown, HTML, XML, CSV, TSV, JSON, YAML, RST, AsciiDoc, LaTeX, LOG";
export const DOCUMENT_TEXT_LIMIT = 60000;
const FILE_LIMIT = 20 * 1024 * 1024;
const XML_LIMIT = 8 * 1024 * 1024;
export const extensionOf = (name: string) => name.split(".").at(-1)?.toLowerCase() || "";

export function validateDocumentFile(file: Pick<File, "name" | "size"> & { type?: string }) {
  const ext = extensionOf(file.name);
  if (["doc", "docm", "pages", "wps"].includes(ext))
    throw new Error("Bu formatı əvvəlcə DOCX, ODT, RTF və ya TXT kimi saxla, sonra əlavə et.");
  if (![...plainExtensions, ...richExtensions, "pdf"].includes(ext) && !file.type?.startsWith("text/"))
    throw new Error(`Bu format dəstəklənmir. Dəstəklənənlər: ${DOCUMENT_FORMATS}.`);
  if (file.size === 0) throw new Error("Fayl boşdur. Başqa sənəd seç.");
  if (file.size > FILE_LIMIT) throw new Error("Fayl ən çox 20 MB ola bilər.");
  return ext;
}

function decodeText(bytes: Uint8Array) {
  let encoding = "utf-8";
  if (bytes[0] === 0xff && bytes[1] === 0xfe) encoding = "utf-16le";
  else if (bytes[0] === 0xfe && bytes[1] === 0xff) encoding = "utf-16be";
  try {
    const text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
    if (/[\u0000-\u0008\u000e-\u001f]/.test(text)) throw new Error();
    return text.replace(/^\uFEFF/, "");
  } catch {
    throw new Error("Mətn kodlaşdırması oxunmur və ya fayl mətn sənədi deyil. UTF-8 və ya BOM-lu UTF-16 kimi saxla.");
  }
}

function parseXml(text: string) {
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error("Xarici və xüsusi XML obyektləri dəstəklənmir.");
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("Sənədin XML quruluşu zədələnib.");
  return doc;
}

async function readZipXml(zip: JSZip, name: string) {
  const entry = zip.file(name);
  if (!entry) throw new Error("Sənədin mətn hissəsi tapılmadı. Faylın düzgün formatda olduğunu yoxla.");
  // Stop expansion as soon as a document part exceeds its budget.
  const bytes = await new Promise<Uint8Array>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    let size = 0;
    let stopped = false;
    // JSZip documents this streaming API, but its bundled types omit it.
    type ZipStream = { on(event: string, callback: (...args: any[]) => void): ZipStream; pause(): ZipStream; resume(): ZipStream };
    const stream = (entry as unknown as { internalStream(type: string): ZipStream }).internalStream("uint8array");
    stream.on("data", (chunk: Uint8Array) => {
      if (stopped) return;
      size += chunk.length;
      if (size > XML_LIMIT) {
        stopped = true;
        stream.pause();
        chunks.length = 0;
        reject(new Error("Sənədin açılmış mətn hissəsi 8 MB limitini aşır."));
      } else chunks.push(chunk);
    }).on("error", reject).on("end", () => {
      if (stopped) return;
      const result = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
      resolve(result);
    }).resume();
  });
  return parseXml(decodeText(bytes));
}

const WORD = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const WORD_STRICT = "http://purl.oclc.org/ooxml/wordprocessingml/main";
const ODT = "urn:oasis:names:tc:opendocument:xmlns:text:1.0";
function wordParagraphs(doc: Document) {
  const namespace = doc.documentElement.namespaceURI === WORD_STRICT ? WORD_STRICT : WORD;
  const paragraphs = [...doc.getElementsByTagNameNS(namespace, "p")];
  return paragraphs.map(p => {
    let text = "";
    const visit = (node: Element) => {
      if (node.namespaceURI === namespace) {
        if (["del", "instrText"].includes(node.localName)) return;
        if (node.localName === "t") { text += node.textContent || ""; return; }
        if (node.localName === "tab") { text += "\t"; return; }
        if (["br", "cr"].includes(node.localName)) { text += "\n"; return; }
      }
      for (const child of node.children) visit(child);
    };
    visit(p);
    return text;
  }).join("\n\n");
}

function odtText(doc: Document) {
  const nodes = [...doc.getElementsByTagNameNS(ODT, "p"), ...doc.getElementsByTagNameNS(ODT, "h")];
  nodes.sort((a, b) => a.compareDocumentPosition(b) & 4 ? -1 : 1);
  let length = 0;
  const bounded = (value: string) => {
    length += value.length;
    if (length > DOCUMENT_TEXT_LIMIT) throw new Error("Sənəd mətni 60 000 simvol limitini aşır.");
    return value;
  };
  function text(node: Node): string {
    if (node.nodeType === 3) return bounded(node.nodeValue || "");
    if (node.nodeType !== 1) return "";
    const el = node as Element;
    if (el.namespaceURI === ODT) {
      if (["note", "tracked-changes"].includes(el.localName)) return "";
      if (el.localName === "tab") return "\t";
      if (el.localName === "line-break") return "\n";
      if (el.localName === "s") {
        const count = Number(el.getAttributeNS(ODT, "c") || 1);
        if (!Number.isInteger(count) || count < 1 || count > DOCUMENT_TEXT_LIMIT) throw new Error("Sənəddə boşluq sayı limiti aşır.");
        return bounded(" ".repeat(count));
      }
    }
    return [...node.childNodes].map(text).join("");
  }
  return nodes.filter(node => {
    for (let parent = node.parentElement; parent; parent = parent.parentElement)
      if (parent.namespaceURI === ODT && ["note", "tracked-changes", "p", "h"].includes(parent.localName)) return false;
    return true;
  }).map(text).join("\n\n");
}

// RTF destinations and scoped state are parsed; markup is never rendered.
export function rtfText(input: string) {
  if (!/^\{\\rtf1\b/.test(input)) throw new Error("Bu fayl etibarlı RTF deyil.");
  type State = { skip: boolean; uc: number; encoding: string };
  let state: State = { skip: false, uc: 1, encoding: "windows-1252" };
  const stack: State[] = [];
  let output = "", fallback = 0;
  const emit = (text: string) => {
    if (fallback) { fallback--; return; }
    if (!state.skip) output += text;
    if (output.length > DOCUMENT_TEXT_LIMIT) throw new Error("Sənəd mətni 60 000 simvol limitini aşır.");
  };
  const hidden = new Set(["fonttbl", "colortbl", "stylesheet", "info", "pict", "object", "header", "footer", "headerl", "headerr", "footerl", "footerr", "listtable", "listoverridetable", "fldinst", "datastore", "xmlnstbl", "themedata"]);
  for (let i = 0; i < input.length;) {
    const char = input[i++];
    if (char === "{") { if (stack.length >= 200) throw new Error("RTF quruluşu həddən artıq dərindir."); stack.push({ ...state }); continue; }
    if (char === "}") { const previous = stack.pop(); if (!previous) throw new Error("RTF quruluşu zədələnib."); state = previous; continue; }
    if (char !== "\\") {
      if (char.charCodeAt(0) > 127) {
        const bytes = [char.charCodeAt(0)];
        while (i < input.length && input.charCodeAt(i) > 127) bytes.push(input.charCodeAt(i++));
        try { for (const letter of new TextDecoder(state.encoding, { fatal: true }).decode(new Uint8Array(bytes))) emit(letter); }
        catch { throw new Error("RTF kodlaşdırması oxunmur. DOCX və ya UTF-8 TXT kimi saxla."); }
      } else if (char !== "\n" && char !== "\r") emit(char);
      continue;
    }
    const rest = input.slice(i);
    if (rest[0] === "*") { state.skip = true; i++; continue; }
    if (/^[\\{}]/.test(rest)) { emit(rest[0]); i++; continue; }
    if (rest[0] === "'") {
      // Decode consecutive bytes together, including multibyte codepages.
      const values: number[] = [];
      while (input[i] === "'" && /^[0-9a-f]{2}$/i.test(input.slice(i + 1, i + 3))) {
        values.push(parseInt(input.slice(i + 1, i + 3), 16)); i += 3;
        if (input[i] === "\\" && input[i + 1] === "'") i++; else break;
      }
      if (!values.length) throw new Error("RTF mətn kodu zədələnib.");
      try { for (const letter of new TextDecoder(state.encoding, { fatal: true }).decode(new Uint8Array(values))) emit(letter); }
      catch { throw new Error("RTF kodlaşdırması dəstəklənmir. Faylı DOCX və ya UTF-8 TXT kimi saxla."); }
      continue;
    }
    const control = /^([a-z]+)(-?\d+)? ?/i.exec(rest);
    if (!control) { if (rest[0] === "~") emit(" "); else if (rest[0] === "_") emit("-"); i++; continue; }
    i += control[0].length;
    const word = control[1], n = Number(control[2]);
    if (hidden.has(word)) state.skip = true;
    else if (word === "ansicpg") {
      state.encoding = n === 65001 ? "utf-8" : `windows-${n}`;
      try { new TextDecoder(state.encoding); } catch { throw new Error("RTF kodlaşdırması dəstəklənmir. DOCX kimi saxla."); }
    } else if (["mac", "pc", "pca"].includes(word)) throw new Error("Bu RTF kodlaşdırması dəstəklənmir. DOCX və ya UTF-8 TXT kimi saxla.");
    else if (word === "uc") { if (!Number.isInteger(n) || n < 0 || n > 16) throw new Error("RTF Unicode quruluşu düzgün deyil."); state.uc = n; }
    else if (word === "u") { if (!Number.isInteger(n) || n < -32768 || n > 65535) throw new Error("RTF Unicode kodu düzgün deyil."); if (!state.skip) { output += String.fromCharCode(n < 0 ? n + 65536 : n); fallback = state.uc; } }
    else if (word === "bin") { if (!Number.isInteger(n) || n < 0 || n > input.length - i) throw new Error("RTF ikili hissəsi zədələnib."); i += n; }
    else if (word === "par") emit("\n\n");
    else if (["line", "row"].includes(word)) emit("\n");
    else if (["tab", "cell"].includes(word)) emit("\t");
    else if (word === "emdash") emit("—");
    else if (word === "endash") emit("–");
    else if (["lquote", "rquote"].includes(word)) emit("’");
    else if (["ldblquote", "rdblquote"].includes(word)) emit('"');
  }
  if (stack.length) throw new Error("RTF quruluşu zədələnib.");
  return output;
}

export async function readDocument(file: File): Promise<Reference["pages"]> {
  const ext = validateDocumentFile(file);
  if (ext === "pdf") throw new Error("PDF üçün səhifə seçimi istifadə edilməlidir.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  let text: string;
  if (ext === "docx" || ext === "odt") {
    const { default: JSZip } = await import("jszip");
    let zip: JSZip;
    try { zip = await JSZip.loadAsync(bytes); }
    catch { throw new Error("Sənəd açılmadı. Fayl zədələnmiş və ya parolla qorunmuş ola bilər."); }
    if (Object.keys(zip.files).length > 2000) throw new Error("Sənəddə həddən artıq çox hissə var.");
    if (ext === "docx") {
      text = wordParagraphs(await readZipXml(zip, "word/document.xml"));
      for (const part of ["word/footnotes.xml", "word/endnotes.xml"]) {
        if (zip.file(part)) text += "\n\n" + wordParagraphs(await readZipXml(zip, part));
      }
    } else text = odtText(await readZipXml(zip, "content.xml"));
  } else if (ext === "rtf") {
    // Preserve byte values until the scoped RTF codepage is known.
    const chunks: string[] = [];
    for (let offset = 0; offset < bytes.length; offset += 16384)
      chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 16384)));
    text = rtfText(chunks.join(""));
  } else {
    text = decodeText(bytes);
    if (ext === "html" || ext === "htm") {
      // Template content stays inert: no scripts or external image/frame requests.
      const template = document.createElement("template");
      template.innerHTML = text;
      const fragment = template.content;
      fragment.querySelectorAll("script,style,noscript,template,head,title,iframe,object,svg").forEach(el => el.remove());
      fragment.querySelectorAll("br").forEach(el => el.replaceWith("\n"));
      fragment.querySelectorAll("p,div,li,h1,h2,h3,h4,h5,h6,tr,section,article,blockquote,pre").forEach(el => el.append("\n\n"));
      fragment.querySelectorAll("td,th").forEach(el => el.append("\t"));
      text = fragment.textContent || "";
    } else if (ext === "xml") {
      const doc = parseXml(text);
      const walk = (node: Node): string => node.nodeType === 3 ? node.nodeValue || "" :
        [...node.childNodes].map(walk).filter(value => value.trim()).join("\n");
      text = walk(doc.documentElement);
    }
  }
  text = text.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) throw new Error("Sənəddə oxuna bilən mətn tapılmadı.");
  if (text.length > DOCUMENT_TEXT_LIMIT) throw new Error("Sənəd mətni 60 000 simvol limitini aşır. Daha qısa sənəd seç.");
  // Text documents do not have stable physical pages. One source text, not invented pagination.
  return [{ number: 1, text }];
}
