import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import JSZip from "jszip";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { JSDOM } from "jsdom";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = path.join(root, ".checks", "visuals");
await fs.mkdir(out, { recursive: true });
for (const name of ["model", "raster"]) {
  const source = await fs.readFile(
    path.join(root, "src", `${name}.ts`),
    "utf8",
  );
  let code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  code = code.replace(/from (['"])\.\/model\1/g, "from './model.mjs'");
  await fs.writeFile(path.join(out, `${name}.mjs`), code);
}
const m = await import(pathToFileURL(path.join(out, "model.mjs")).href);
const { validateRaster, normalizeRaster } = await import(
  pathToFileURL(path.join(out, "raster.mjs")).href
);
const canvas = createCanvas(8, 4);
canvas.getContext("2d").fillRect(0, 0, 8, 4);
const png = canvas.toBuffer("image/png");
const asset = {
  data: `data:image/png;base64,${png.toString("base64")}`,
  width: 8,
  height: 4,
  alt: "Sınaq & şəkil",
  credit: "Yoxlama mənbəsi & müəllif",
};
assert.ok(m.isImageAsset(asset));
assert.equal(
  m.isImageAsset({ ...asset, data: "https://example.com/image.png" }),
  false,
);
assert.equal(m.isImageAsset({ ...asset, width: 9 }), false);
assert.throws(() => validateRaster(new Uint8Array(png), "logo.svg"), /PNG/);
assert.throws(
  () => validateRaster(new Uint8Array([1, 2, 3]), "fake.png"),
  /etibarlı/,
);
assert.equal(validateRaster(new Uint8Array(png), "logo.png").width, 8);
const callbacks = new Map();
let serial = 0;
const create = URL.createObjectURL,
  revoke = URL.revokeObjectURL;
URL.createObjectURL = (file) => {
  const url = `blob:unit-${++serial}`;
  callbacks.set(url, file);
  return url;
};
URL.revokeObjectURL = (url) => callbacks.delete(url);
globalThis.Image = class {
  set src(value) {
    const blob = callbacks.get(value);
    blob
      .arrayBuffer()
      .then((bytes) => loadImage(Buffer.from(bytes)))
      .then((native) => {
        this.native = native;
        this.naturalWidth = native.width;
        this.naturalHeight = native.height;
        this.onload?.();
      })
      .catch(() => this.onerror?.());
  }
};
globalThis.document = {
  createElement(name) {
    assert.equal(name, "canvas");
    const native = createCanvas(1, 1);
    const ctx = native.getContext("2d");
    return {
      get width() {
        return native.width;
      },
      set width(value) {
        native.width = value;
      },
      get height() {
        return native.height;
      },
      set height(value) {
        native.height = value;
      },
      getContext() {
        return {
          clearRect: (...args) => ctx.clearRect(...args),
          drawImage: (image, ...args) => ctx.drawImage(image.native, ...args),
        };
      },
      toDataURL: (...args) => native.toDataURL(...args),
    };
  },
};
try {
  const large = createCanvas(2400, 1200);
  large.getContext("2d").fillRect(0, 0, 2400, 1200);
  const normalized = await normalizeRaster(
    new File([large.toBuffer("image/png")], "large.png", { type: "image/png" }),
  );
  assert.ok(m.isImageAsset(normalized));
  assert.equal(normalized.width, 1280);
  assert.equal(normalized.height, 640);
  const noisy = createCanvas(640, 640);
  const noisyContext = noisy.getContext("2d");
  const pixels = noisyContext.createImageData(640, 640);
  let seed = 17;
  for (let i = 0; i < pixels.data.length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    pixels.data[i] = i % 4 === 3 ? 255 : seed >>> 24;
  }
  noisyContext.putImageData(pixels, 0, 0);
  const compact = await normalizeRaster(
    new File([noisy.toBuffer("image/png")], "noise.png", { type: "image/png" }),
  );
  assert.ok(m.isImageAsset(compact));
  assert.ok(compact.data.length <= m.IMAGE_LIMIT);
  assert.ok(compact.width < 640);
  const jpeg = await normalizeRaster(
    new File([canvas.toBuffer("image/jpeg")], "photo.jpg", {
      type: "image/jpeg",
    }),
  );
  assert.ok(m.isImageAsset(jpeg));
  assert.ok(jpeg.data.startsWith("data:image/jpeg;"));
  assert.equal(callbacks.size, 0, "Object URL-lər təmizlənməlidir");
} finally {
  URL.createObjectURL = create;
  URL.revokeObjectURL = revoke;
  delete globalThis.Image;
  delete globalThis.document;
}
for (const kind of m.slideBlocks.map((b) => b.id)) {
  const slide = m.createBlock(kind);
  assert.ok(slide.id);
  assert.ok(m.layouts.some((l) => l.id === slide.layout));
}
assert.equal(
  new Set(m.slideBlocks.map((b) => m.createBlock(b.id).id)).size,
  m.slideBlocks.length,
);
const manual = m.createManualDeck("Yeni mövzu");
assert.equal(manual.length, 2);
assert.equal(manual[0].title, "Yeni mövzu");
assert.throws(() => m.createManualDeck(" "));
const comparison = {
  leftTitle: "Birinci yanaşma",
  rightTitle: "İkinci yanaşma",
  left: "Öz materialından birinci izah.",
  right: "Öz materialından ikinci izah.",
};
const timeline = {
  steps: [
    {
      label: "Mərhələ 1",
      title: "Araşdırma",
      body: "Mövzunun materialını topla.",
    },
    {
      label: "Mərhələ 2",
      title: "Hazırlıq",
      body: "Təqdimatın quruluşunu hazırla.",
    },
    {
      label: "Mərhələ 3",
      title: "Çıxış",
      body: "Hazırladığın təqdimatı izah et.",
    },
  ],
};
assert.ok(m.isComparisonData(comparison));
assert.ok(m.isTimelineData(timeline));
const slides = [
  { id: "c", title: "İki yanaşma", body: "", layout: "comparison", comparison },
  { id: "t", title: "Ardıcıllıq", body: "", layout: "timeline", timeline },
  {
    id: "i",
    title: "Şəkilli izah",
    body: "Qısa izah.",
    layout: "image",
    image: asset,
  },
];
assert.equal(m.inspectDeck(slides).length, 0);
assert.ok(
  m.dataProblems({ ...slides[2], image: { ...asset, alt: "" } }).length,
);
const xmlDom = new JSDOM("");
const xmlParser = new xmlDom.window.DOMParser();
const previous = process.cwd();
process.chdir(out);
try {
  for (const { id: theme } of m.themes) {
    const topic = `Vizual ${theme}`;
    await m.exportPptx({
      id: "v",
      topic,
      subject: "Yoxlama",
      author: "Sınaq",
      theme,
      slides,
      updatedAt: "",
    });
    const zip = await JSZip.loadAsync(await fs.readFile(`${topic}.pptx`));
    const xml = await zip.file("ppt/slides/slide1.xml").async("string");
    assert.ok(xml.includes(comparison.left) && xml.includes(comparison.right));
    const timelineXml = await zip.file("ppt/slides/slide2.xml").async("string");
    assert.ok(
      timelineXml.includes("Araşdırma") &&
        timelineXml.includes("Hazırlıq") &&
        timelineXml.includes("Çıxış"),
    );
    const imageXml = await zip.file("ppt/slides/slide3.xml").async("string");
    const parsed = xmlParser.parseFromString(imageXml, "application/xml");
    assert.equal(parsed.getElementsByTagName("parsererror").length, 0);
    assert.ok(
      imageXml.includes("<p:pic>") &&
        imageXml.includes("Sınaq &amp; şəkil") &&
        imageXml.includes("Yoxlama mənbəsi &amp; müəllif"),
    );
    const media = Object.keys(zip.files).filter((p) =>
      /^ppt\/media\/.*\.png$/.test(p),
    );
    assert.equal(media.length, 1);
    assert.deepEqual(await zip.file(media[0]).async("nodebuffer"), png);
  }
} finally {
  process.chdir(previous);
  xmlDom.window.close();
}
console.log(
  "Keçdi: bloklar və əl ilə yaratma, PNG/JPEG oxunuşu/ölçüləndirmə, URI təmizlənməsi, yanlış şəkil rəddi, 10 dizaynda müqayisə/mərhələ və embedded şəkil/alt mətn ixracı.",
);
