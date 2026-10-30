import { ImageAsset, IMAGE_LIMIT, rasterInfo } from "./model";

export const UPLOAD_IMAGE_LIMIT = 5 * 1024 * 1024;
export function validateRaster(bytes: Uint8Array, name: string) {
  if (bytes.length > UPLOAD_IMAGE_LIMIT)
    throw new Error("Şəkil ən çox 5 MB ola bilər.");
  if (!/\.(png|jpe?g)$/i.test(name))
    throw new Error("PNG və ya JPEG faylı seç.");
  const info = rasterInfo(bytes);
  if (!info) throw new Error("Fayl etibarlı PNG/JPEG kimi oxunmadı.");
  if (
    info.width * info.height > 20000000 ||
    Math.max(info.width, info.height) > 12000
  )
    throw new Error(
      "Şəkil çox böyükdür. Ən çox 20 milyon piksel və 12 000 piksel tərəf ölçüsü qəbul edilir.",
    );
  return info;
}
export async function normalizeRaster(file: File): Promise<ImageAsset> {
  if (file.size > UPLOAD_IMAGE_LIMIT)
    throw new Error("Şəkil ən çox 5 MB ola bilər.");
  const info = validateRaster(
    new Uint8Array(await file.arrayBuffer()),
    file.name,
  );
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Şəkli açmaq vaxtı bitdi. Başqa fayl seç.")),
        15000,
      );
      image.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      image.onerror = () => {
        clearTimeout(timer);
        reject(new Error("Şəklin məzmunu açıla bilmədi."));
      };
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Bu brauzerdə şəkli hazırlamaq mümkün olmadı.");
    let edge = Math.min(
      1280,
      Math.max(image.naturalWidth, image.naturalHeight),
    );
    for (let attempt = 0; attempt < 10; attempt++) {
      const scale = Math.min(
        1,
        edge / Math.max(image.naturalWidth, image.naturalHeight),
      );
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL(info.mime, 0.82);
      if (data.length <= IMAGE_LIMIT)
        return {
          data,
          width: canvas.width,
          height: canvas.height,
          alt: "",
          credit: "",
        };
      edge *= 0.78;
    }
    throw new Error(
      "Şəkil yaddaş limitinə uyğunlaşdırıla bilmədi. Daha kiçik fayl seç.",
    );
  } finally {
    image.onload = null;
    image.onerror = null;
    URL.revokeObjectURL(url);
  }
}
