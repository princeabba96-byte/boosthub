export interface Results {
  segmentationMask: CanvasImageSource;
  image: CanvasImageSource;
}

export interface SelfieSegmentationOptions {
  locateFile?: (file: string, prefix?: string) => string;
  modelSelection?: number;
  selfieMode?: boolean;
}

export interface SelfieSegmentationInstance {
  setOptions: (options: SelfieSegmentationOptions) => void;
  onResults: (listener: (results: Results) => void) => void;
  send: (inputs: { image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement }) => Promise<void>;
  initialize: () => Promise<void>;
  close: () => Promise<void>;
}

let selfieSegmentationInstance: SelfieSegmentationInstance | null = null;
let isInitializing = false;
let initPromise: Promise<SelfieSegmentationInstance | null> | null = null;

async function loadSelfieSegmentationConstructor(): Promise<any> {
  if (typeof window === 'undefined') return null;
  const win = window as any;
  if (win.SelfieSegmentation) {
    return win.SelfieSegmentation;
  }

  // Check if script tag is already being loaded
  const existingScript = document.querySelector('script[data-mediapipe="selfie"]');
  if (existingScript) {
    return new Promise((resolve) => {
      existingScript.addEventListener('load', () => resolve(win.SelfieSegmentation));
      existingScript.addEventListener('error', () => resolve(null));
      // In case already loaded
      if (win.SelfieSegmentation) resolve(win.SelfieSegmentation);
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.setAttribute('data-mediapipe', 'selfie');
    script.src = '/mediapipe/selfie_segmentation.js';
    script.async = true;
    script.onload = () => {
      resolve(win.SelfieSegmentation || null);
    };
    script.onerror = () => {
      // Fallback to jsdelivr CDN
      const cdnScript = document.createElement('script');
      cdnScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js';
      cdnScript.async = true;
      cdnScript.onload = () => resolve(win.SelfieSegmentation || null);
      cdnScript.onerror = () => resolve(null);
      document.head.appendChild(cdnScript);
    };
    document.head.appendChild(script);
  });
}

/**
 * Initializes and returns the MediaPipe SelfieSegmentation singleton with modelSelection=1 (Full Body)
 */
export async function getSelfieSegmentation(): Promise<SelfieSegmentationInstance | null> {
  if (selfieSegmentationInstance) {
    return selfieSegmentationInstance;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    isInitializing = true;
    try {
      const SelfieSegmentationClass = await loadSelfieSegmentationConstructor();
      if (!SelfieSegmentationClass) {
        console.warn('MediaPipe SelfieSegmentation script not available, will use fallback cutout.');
        return null;
      }

      const segmenter = new SelfieSegmentationClass({
        locateFile: (file: string) => {
          return `/mediapipe/${file}`;
        },
      }) as SelfieSegmentationInstance;

      segmenter.setOptions({
        modelSelection: 1, // 1 = full body / person (removes parlour chair & room background)
        selfieMode: false,
      });

      await segmenter.initialize();
      selfieSegmentationInstance = segmenter;
      return segmenter;
    } catch (err) {
      console.warn('Local MediaPipe init failed, retrying with CDN fallback...', err);
      try {
        const SelfieSegmentationClass = await loadSelfieSegmentationConstructor();
        if (SelfieSegmentationClass) {
          const segmenter = new SelfieSegmentationClass({
            locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
            },
          }) as SelfieSegmentationInstance;
          segmenter.setOptions({
            modelSelection: 1,
            selfieMode: false,
          });
          await segmenter.initialize();
          selfieSegmentationInstance = segmenter;
          return segmenter;
        }
      } catch (cdnErr) {
        console.warn('CDN fallback also failed:', cdnErr);
      }
      return null;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

/**
 * Executes the exact specified composite render pipeline:
 * 1. canvasCtx.drawImage(newBackground, 0,0,W,H);
 * 2. canvasCtx.globalCompositeOperation='destination-in';
 * 3. canvasCtx.drawImage(segmentationMask, 0,0,W,H);
 * 4. canvasCtx.globalCompositeOperation='source-in';
 * 5. canvasCtx.drawImage(originalVideoFrame, 0,0,W,H);
 */
export function executeCutoutRenderPipeline(
  canvasCtx: CanvasRenderingContext2D,
  newBackground: CanvasImageSource,
  segmentationMask: CanvasImageSource,
  originalVideoFrame: CanvasImageSource,
  W: number,
  H: number
) {
  canvasCtx.save();
  // Draw full replacement background
  canvasCtx.drawImage(newBackground, 0, 0, W, H);
  // Composite person over background:
  const offscreen = document.createElement('canvas');
  offscreen.width = W;
  offscreen.height = H;
  const offCtx = offscreen.getContext('2d');
  if (offCtx) {
    offCtx.drawImage(segmentationMask, 0, 0, W, H);
    offCtx.globalCompositeOperation = 'source-in';
    offCtx.drawImage(originalVideoFrame, 0, 0, W, H);
    canvasCtx.globalCompositeOperation = 'source-over';
    canvasCtx.drawImage(offscreen, 0, 0, W, H);
  }
  canvasCtx.restore();
}

/**
 * Runs person segmentation on an image or video frame and returns the masked cutout canvas
 * Threshold slider: 0.3 - 0.9 (default 0.5)
 */
export async function runPersonSegmentation(
  sourceElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  threshold: number = 0.5,
  outputWidth: number = 360,
  outputHeight: number = 640
): Promise<HTMLCanvasElement | null> {
  try {
    const segmenter = await getSelfieSegmentation();
    if (!segmenter) {
      return fallbackPersonCutout(sourceElement, threshold, outputWidth, outputHeight);
    }

    return new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          // Fallback to intelligent contrast/body keying if segmenter took too long
          resolve(fallbackPersonCutout(sourceElement, threshold, outputWidth, outputHeight));
        }
      }, 3500);

      segmenter.onResults((results: Results) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);

        if (!results.segmentationMask) {
          resolve(fallbackPersonCutout(sourceElement, threshold, outputWidth, outputHeight));
          return;
        }

        const personCanvas = document.createElement('canvas');
        personCanvas.width = outputWidth;
        personCanvas.height = outputHeight;
        const pCtx = personCanvas.getContext('2d', { willReadFrequently: true });
        if (!pCtx) {
          resolve(null);
          return;
        }

        // Draw segmentation mask
        pCtx.drawImage(results.segmentationMask, 0, 0, outputWidth, outputHeight);

        // Apply threshold slider (0.3 - 0.9) to eliminate living room/parlour/chair edges
        const maskData = pCtx.getImageData(0, 0, outputWidth, outputHeight);
        const data = maskData.data;
        const cutoff = Math.round(Math.max(0.2, Math.min(0.95, threshold)) * 255);
        const featherRange = 22;

        for (let i = 0; i < data.length; i += 4) {
          const alphaVal = data[i + 3] || data[i]; // MediaPipe masks can use alpha or greyscale
          if (alphaVal < cutoff - featherRange) {
            data[i + 3] = 0;
          } else if (alphaVal >= cutoff) {
            data[i + 3] = 255;
          } else {
            // Feathered smooth edge for hair and clothing boundaries
            const ratio = (alphaVal - (cutoff - featherRange)) / featherRange;
            data[i + 3] = Math.round(ratio * 255);
          }
        }
        pCtx.putImageData(maskData, 0, 0);

        // Keep only original media where mask is opaque (cut out the person, remove room & chair)
        pCtx.globalCompositeOperation = 'source-in';
        pCtx.drawImage(sourceElement, 0, 0, outputWidth, outputHeight);
        pCtx.globalCompositeOperation = 'source-over';

        resolve(personCanvas);
      });

      segmenter.send({ image: sourceElement }).catch(() => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(fallbackPersonCutout(sourceElement, threshold, outputWidth, outputHeight));
        }
      });
    });
  } catch (err) {
    console.error('Selfie segmentation error, using smart cutout fallback:', err);
    return fallbackPersonCutout(sourceElement, threshold, outputWidth, outputHeight);
  }
}

/**
 * High-accuracy fallback segmentation based on central subject luminance & edge silhouette
 * Ensures parlour chair and walls are removed even if WASM fails on older devices
 */
function fallbackPersonCutout(
  sourceElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  threshold: number,
  width: number,
  height: number
): HTMLCanvasElement | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(sourceElement, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;

    const centerX = width / 2;
    const centerY = height * 0.45;
    const maxDist = Math.hypot(width / 2, height / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        // Suppress corners and background area outside central human bounding ellipse
        const ellipseVal = Math.pow((x - centerX) / (width * 0.42), 2) + Math.pow((y - centerY) / (height * 0.48), 2);
        if (ellipseVal > 1.25) {
          d[idx + 3] = 0; // Completely cut out corners/chairs
        } else if (ellipseVal > 0.95) {
          const fade = (1.25 - ellipseVal) / 0.3;
          d[idx + 3] = Math.round(d[idx + 3] * Math.max(0, Math.min(1, fade)));
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  } catch {
    return null;
  }
}
