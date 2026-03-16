import fs from "fs";
import path from "path";

const uploadsDir = path.join(process.cwd(), "public", "uploads");

export function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

export function getUploadPath(fileName: string) {
  return path.join(uploadsDir, fileName);
}

export async function saveUploadFile(file: File) {
  ensureUploadsDir();
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const dest = path.join(uploadsDir, safeName);
  await fs.promises.writeFile(dest, buffer);
  return { fileName: file.name, path: dest, safeName };
}

export function getPublicUploadPath(safeName: string) {
  return `/uploads/${safeName}`;
}
