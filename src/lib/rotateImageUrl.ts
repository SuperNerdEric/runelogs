const rotatedUrlCache = new Map<string, string>();
const rotatedUrlInflight = new Map<string, Promise<string>>();

/** Rotate a same-origin image 90° clockwise; results are cached by URL. */
export function getRotatedClockwiseImageUrl(url: string): Promise<string> {
  const cached = rotatedUrlCache.get(url);
  if (cached) {
    return Promise.resolve(cached);
  }

  const inflight = rotatedUrlInflight.get(url);
  if (inflight) {
    return inflight;
  }

  const promise = new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalHeight;
        canvas.height = image.naturalWidth;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Could not create canvas context"));
          return;
        }
        context.translate(canvas.width, 0);
        context.rotate(Math.PI / 2);
        context.drawImage(image, 0, 0);
        const rotatedUrl = canvas.toDataURL("image/png");
        rotatedUrlCache.set(url, rotatedUrl);
        rotatedUrlInflight.delete(url);
        resolve(rotatedUrl);
      } catch (error) {
        rotatedUrlInflight.delete(url);
        reject(error);
      }
    };
    image.onerror = () => {
      rotatedUrlInflight.delete(url);
      reject(new Error(`Failed to load image for rotation: ${url}`));
    };
    image.src = url;
  });

  rotatedUrlInflight.set(url, promise);
  return promise;
}
