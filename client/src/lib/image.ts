/**
 * Turn a picture the user picked into a small square JPEG data URL (256x256, centre-cropped).
 * Doing this in the browser keeps uploads tiny (about 15-40 KB) and strips metadata such as GPS tags.
 */
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_INPUT = 10 * 1024 * 1024; // 10 MB picked file
const MAX_OUTPUT = 60 * 1024; // ~60 KB result

export async function fileToAvatar(file: File, size = 256): Promise<string> {
  if (!TYPES.includes(file.type)) throw new Error('Choose a JPG, PNG or WebP image.');
  if (file.size > MAX_INPUT) throw new Error('That image is too large. Choose one under 10 MB.');

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('That file could not be read as an image.'));
      i.src = url;
    });

    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser cannot process images.');
    ctx.fillStyle = '#fff'; // flatten transparent PNGs onto white
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

    // Lower the quality until it fits the size budget.
    for (const q of [0.88, 0.8, 0.7, 0.6, 0.5]) {
      const out = canvas.toDataURL('image/jpeg', q);
      if (out.length * 0.75 <= MAX_OUTPUT) return out;
    }
    return canvas.toDataURL('image/jpeg', 0.4);
  } finally {
    URL.revokeObjectURL(url);
  }
}