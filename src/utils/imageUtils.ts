/**
 * Image processing, compression, and automatic background transparency utility.
 * Ensures fast loading, transparent stamps/signatures, and clean rendering.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/webp' | 'image/jpeg' | 'image/png';
}

export interface TransparencyOptions {
  type?: 'signature' | 'stamp' | 'logo' | 'general';
  threshold?: number; // 0-255 background luminance cutoff
  feather?: number; // edge transition softness
  boostContrast?: boolean;
  enhanceColor?: boolean;
  autoCrop?: boolean;
  inkColorMode?: 'original' | 'pure_black' | 'kemenag_blue' | 'auto';
  sensitivity?: 'normal' | 'high' | 'ultra'; // ultra is perfect for dim/shadowy paper photos
}

/**
 * Automatically and adaptively removes paper/white/light/shadowy backgrounds from stamps, signatures, and logos,
 * converting them into crystal-clear transparent PNGs with de-fringed edges and enhanced ink clarity.
 */
export async function makeStampOrSignatureTransparent(
  source: File | Blob | string,
  options: TransparencyOptions = {}
): Promise<string> {
  const {
    type = 'stamp',
    feather = 35,
    boostContrast = true,
    enhanceColor = true,
    autoCrop = true,
    inkColorMode = 'auto',
    sensitivity = 'high',
  } = options;

  return new Promise((resolve) => {
    const processImg = (img: HTMLImageElement) => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          return resolve(typeof source === 'string' ? source : '');
        }

        // Limit maximum processing dimension for speed and memory efficiency
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          return resolve(typeof source === 'string' ? source : '');
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const totalPixels = width * height;

        // 1. Check existing transparency
        let transparentPixelCount = 0;
        for (let i = 0; i < totalPixels; i++) {
          if (data[i * 4 + 3] < 50) {
            transparentPixelCount++;
          }
        }
        const hasHighExistingTransparency = (transparentPixelCount / totalPixels) > 0.35;

        // 2. Statistical Analysis & Paper Background Estimation
        // Sample luminances across the image to find the true background paper level
        const lumaList: number[] = new Array(totalPixels);
        let edgeR = 0, edgeG = 0, edgeB = 0, edgeCount = 0;

        for (let i = 0; i < totalPixels; i++) {
          const off = i * 4;
          const r = data[off];
          const g = data[off + 1];
          const b = data[off + 2];
          const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          lumaList[i] = lum;

          // Sample edges (top, bottom, left, right rows)
          const px = i % width;
          const py = Math.floor(i / width);
          if (px <= 4 || px >= width - 5 || py <= 4 || py >= height - 5) {
            edgeR += r;
            edgeG += g;
            edgeB += b;
            edgeCount++;
          }
        }

        // Calculate average edge color (paper tone)
        const avgEdgeR = edgeCount > 0 ? edgeR / edgeCount : 255;
        const avgEdgeG = edgeCount > 0 ? edgeG / edgeCount : 255;
        const avgEdgeB = edgeCount > 0 ? edgeB / edgeCount : 255;
        const avgEdgeLum = 0.299 * avgEdgeR + 0.587 * avgEdgeG + 0.114 * avgEdgeB;

        // Sort a sub-sample to find 90th percentile luminance (paper level)
        const sampleStep = Math.max(1, Math.floor(totalPixels / 2000));
        const subSamples: number[] = [];
        for (let i = 0; i < totalPixels; i += sampleStep) {
          subSamples.push(lumaList[i]);
        }
        subSamples.sort((a, b) => a - b);
        const p90Lum = subSamples[Math.floor(subSamples.length * 0.90)] || 240;

        // Estimated paper luminance (even for dark/shadowy phone photos)
        const estimatedPaperLum = Math.max(130, Math.min(255, Math.max(p90Lum, avgEdgeLum)));

        // Cutoff margins based on sensitivity
        const paperMargin = sensitivity === 'ultra' ? 32 : sensitivity === 'high' ? 24 : 16;
        const cutoffLum = Math.max(105, estimatedPaperLum - paperMargin);

        let minX = width, minY = height, maxX = 0, maxY = 0;
        let hasOpaquePixels = false;

        // 3. Process every pixel
        for (let i = 0; i < totalPixels; i++) {
          const offset = i * 4;
          const r = data[offset];
          const g = data[offset + 1];
          const b = data[offset + 2];
          const a = data[offset + 3];

          // Skip if already completely transparent
          if (a === 0) continue;

          const lum = lumaList[i];
          const maxVal = Math.max(r, g, b);
          const minVal = Math.min(r, g, b);
          const saturation = maxVal - minVal;

          // Color distance from sampled paper edge
          const distToEdgeBg = Math.sqrt(
            (r - avgEdgeR) ** 2 + (g - avgEdgeG) ** 2 + (b - avgEdgeB) ** 2
          );

          if (hasHighExistingTransparency) {
            // If already largely transparent, only strip remaining near-white/light halos
            if (lum > 240 && saturation < 25) {
              data[offset + 3] = 0;
              continue;
            }
          } else if (type === 'signature') {
            // ==========================================
            // --- DEDICATED SIGNATURE TRANSPARENCY ---
            // ==========================================
            // Dark ink on light/paper background.
            // 1) Is this pixel background paper?
            const isPaperBackground = lum >= cutoffLum || distToEdgeBg < 28;

            if (isPaperBackground) {
              data[offset + 3] = 0;
              continue;
            }

            // 2) Ink Density calculation
            const maxDelta = Math.max(35, cutoffLum - 20);
            const delta = cutoffLum - lum;
            const densityRatio = Math.max(0, delta / maxDelta);

            // Filter out subtle paper grain/noise
            if (densityRatio < 0.08) {
              data[offset + 3] = 0;
              continue;
            }

            // Alpha curve: crisp, smooth anti-aliased edge
            const normalizedDensity = (densityRatio - 0.08) / 0.62;
            const alphaVal = Math.min(255, Math.max(0, Math.round(Math.pow(Math.min(1, normalizedDensity), 0.75) * 255)));
            data[offset + 3] = alphaVal;

            if (alphaVal > 0) {
              // Determine ink tone (blue vs black)
              const isBluePen = (b > r + 16 && b > g) || (b > 110 && r < 80 && g < 100);

              if (inkColorMode === 'kemenag_blue' || (inkColorMode === 'auto' && isBluePen)) {
                // Render as crisp Royal/Navy Blue Ink (#1e3a8a - #1d4ed8)
                data[offset] = Math.max(15, Math.min(45, Math.round(r * 0.4)));
                data[offset + 1] = Math.max(35, Math.min(75, Math.round(g * 0.6)));
                data[offset + 2] = Math.max(120, Math.min(210, Math.round(b * 1.25)));
              } else if (inkColorMode === 'pure_black' || inkColorMode === 'auto') {
                // Render as crisp Solid Dark Formal Ink (#0f172a / #020617)
                const darkness = Math.max(0, Math.min(30, Math.round((1 - densityRatio) * 35)));
                data[offset] = darkness;
                data[offset + 1] = darkness + 4;
                data[offset + 2] = darkness + 12;
              } else {
                // Original with enhanced contrast
                if (boostContrast) {
                  data[offset] = Math.max(0, Math.round((r - 25) * 1.15));
                  data[offset + 1] = Math.max(0, Math.round((g - 25) * 1.15));
                  data[offset + 2] = Math.max(0, Math.round((b - 25) * 1.15));
                }
              }
            }
          } else if (type === 'stamp') {
            // ==========================================
            // --- DEDICATED STAMP CAP TRANSPARENCY ---
            // ==========================================
            // Colored stamp ink (purple, violet, blue, red) or dark official stamp ink
            const isPurpleViolet = (r > g + 15 && b > g + 15) && lum < 220;
            const isBlueInk = (b > r + 15 && b > g) && lum < 225;
            const isRedInk = (r > b + 25 && r > g + 25) && lum < 225;
            const isDarkStampInk = lum < (cutoffLum - 25);
            const isAnyStampInk = isPurpleViolet || isBlueInk || isRedInk || isDarkStampInk;

            const isPaperBg = lum >= cutoffLum || (distToEdgeBg < 32 && !isAnyStampInk);

            if (isPaperBg && !isAnyStampInk) {
              data[offset + 3] = 0;
              continue;
            }

            if (isAnyStampInk) {
              const inkDensity = isPurpleViolet || isBlueInk || isRedInk
                ? Math.min(255, Math.round((1 - (lum / 240)) * 255 * 1.5 + 40))
                : Math.min(255, Math.round(((cutoffLum - lum) / Math.max(30, cutoffLum - 40)) * 255));

              data[offset + 3] = Math.max(0, Math.min(255, inkDensity));

              if (enhanceColor) {
                if (isPurpleViolet) {
                  // Vibrant Kemenag Violet Stamp
                  data[offset] = Math.min(255, Math.round(r * 1.15 + 15));
                  data[offset + 1] = Math.max(0, Math.round(g * 0.7));
                  data[offset + 2] = Math.min(255, Math.round(b * 1.25 + 20));
                } else if (isBlueInk) {
                  // Vibrant Blue Stamp
                  data[offset] = Math.max(0, Math.round(r * 0.75));
                  data[offset + 1] = Math.max(0, Math.round(g * 0.85));
                  data[offset + 2] = Math.min(255, Math.round(b * 1.3 + 20));
                } else if (isRedInk) {
                  // Vibrant Red Stamp
                  data[offset] = Math.min(255, Math.round(r * 1.25 + 20));
                  data[offset + 1] = Math.max(0, Math.round(g * 0.7));
                  data[offset + 2] = Math.max(0, Math.round(b * 0.7));
                }
              }
            } else {
              // Edge smoothing
              const t = Math.max(0, Math.min(1, (cutoffLum - lum) / feather));
              data[offset + 3] = Math.round(t * 255);
            }
          } else {
            // ==========================================
            // --- LOGO / GENERAL MODE ---
            // ==========================================
            if ((lum >= (options.threshold || 225) && saturation < 20) || distToEdgeBg < 25) {
              data[offset + 3] = 0;
              continue;
            } else if (lum > ((options.threshold || 225) - feather)) {
              const t = ((options.threshold || 225) - lum) / feather;
              data[offset + 3] = Math.max(0, Math.min(255, Math.round(t * 255)));
            }
          }

          // Track bounding box for auto-crop
          if (data[offset + 3] > 15) {
            const px = i % width;
            const py = Math.floor(i / width);
            minX = Math.min(minX, px);
            minY = Math.min(minY, py);
            maxX = Math.max(maxX, px);
            maxY = Math.max(maxY, py);
            hasOpaquePixels = true;
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // 4. Auto-crop empty transparent borders if enabled
        if (autoCrop && hasOpaquePixels && (maxX > minX) && (maxY > minY)) {
          const pad = 8;
          const cropX = Math.max(0, minX - pad);
          const cropY = Math.max(0, minY - pad);
          const cropW = Math.min(width - cropX, (maxX - minX) + (pad * 2));
          const cropH = Math.min(height - cropY, (maxY - minY) + (pad * 2));

          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = Math.max(1, cropW);
          cropCanvas.height = Math.max(1, cropH);
          const cropCtx = cropCanvas.getContext('2d');
          if (cropCtx) {
            cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            return resolve(cropCanvas.toDataURL('image/png'));
          }
        }

        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Transparency processing error, falling back to source:', err);
        resolve(typeof source === 'string' ? source : '');
      }
    };

    // Load image safely
    if (typeof source === 'string') {
      const img = new Image();
      if (source.startsWith('http://') || source.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => processImg(img);
      img.onerror = () => resolve(source);
      img.src = source;
    } else if (source && typeof source === 'object') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawUrl = e.target?.result as string;
        if (!rawUrl) return resolve('');
        const img = new Image();
        img.onload = () => processImg(img);
        img.onerror = () => resolve(rawUrl);
        img.src = rawUrl;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(source as Blob);
    } else {
      resolve('');
    }
  });
}

/**
 * Compresses an image File or base64 DataURL down to a web-optimized size.
 * Keeps transparency for PNG icons/logos/signatures when appropriate.
 */
export async function compressImage(
  source: File | Blob | string,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 600,
    maxHeight = 600,
    quality = 0.85,
    mimeType = 'image/webp',
  } = options;

  return new Promise((resolve, reject) => {
    if (typeof source === 'string') {
      if (!source.startsWith('data:') && !source.startsWith('http://') && !source.startsWith('https://')) {
        return resolve(source);
      }

      const img = new Image();
      if (source.startsWith('http://') || source.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        try {
          let { width, height } = img;
          if (width <= maxWidth && height <= maxHeight && source.startsWith('data:')) {
            return resolve(source);
          }
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(source);

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          let outputType = mimeType;
          let resultDataUrl = '';
          try {
            resultDataUrl = canvas.toDataURL(outputType, quality);
            if (!resultDataUrl.startsWith('data:' + outputType)) {
              outputType = 'image/png';
              resultDataUrl = canvas.toDataURL(outputType);
            }
          } catch {
            outputType = 'image/png';
            resultDataUrl = canvas.toDataURL('image/png');
          }

          resolve(resultDataUrl || source);
        } catch {
          resolve(source);
        }
      };

      img.onerror = () => resolve(source);
      img.src = source;
      return;
    }

    if (source && typeof source === 'object') {
      const reader = new FileReader();
      reader.onerror = (err) => reject(err);
      reader.onload = () => {
        const rawDataUrl = reader.result as string;
        if (!rawDataUrl) {
          return reject(new Error('Failed to read file as data URL'));
        }

        const img = new Image();
        img.onload = () => {
          try {
            let { width, height } = img;
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, width);
            canvas.height = Math.max(1, height);
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              return resolve(rawDataUrl);
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            let outputType = mimeType;
            let resultDataUrl = '';
            try {
              resultDataUrl = canvas.toDataURL(outputType, quality);
              if (!resultDataUrl || !resultDataUrl.startsWith('data:' + outputType)) {
                outputType = 'image/png';
                resultDataUrl = canvas.toDataURL('image/png');
              }
            } catch {
              outputType = 'image/png';
              resultDataUrl = canvas.toDataURL('image/png');
            }

            resolve(resultDataUrl || rawDataUrl);
          } catch (canvasErr) {
            console.warn('Canvas resize fallback to raw data URL:', canvasErr);
            resolve(rawDataUrl);
          }
        };

        img.onerror = (imgErr) => {
          console.warn('Image load error, falling back to raw data URL:', imgErr);
          resolve(rawDataUrl);
        };

        img.src = rawDataUrl;
      };

      reader.readAsDataURL(source as Blob);
      return;
    }

    reject(new Error('Invalid image source'));
  });
}

/**
 * Helper to compress transparent assets (Logos, Stamps, Signatures)
 * Retains transparency while reducing size.
 */
export async function compressLogoOrGraphic(
  source: File | string,
  maxDimension = 512
): Promise<string> {
  return compressImage(source, {
    maxWidth: maxDimension,
    maxHeight: maxDimension,
    quality: 0.9,
    mimeType: 'image/png',
  });
}

/**
 * Helper to process and make Stamp uploads automatically transparent PNGs
 */
export async function processStampUpload(
  source: File | string,
  options?: Partial<TransparencyOptions>
): Promise<string> {
  return makeStampOrSignatureTransparent(source, {
    type: 'stamp',
    feather: 35,
    boostContrast: true,
    enhanceColor: true,
    autoCrop: true,
    sensitivity: 'high',
    ...options,
  });
}

/**
 * Helper to process and make Signature uploads automatically transparent PNGs
 */
export async function processSignatureUpload(
  source: File | string,
  options?: Partial<TransparencyOptions>
): Promise<string> {
  return makeStampOrSignatureTransparent(source, {
    type: 'signature',
    feather: 30,
    boostContrast: true,
    autoCrop: true,
    inkColorMode: 'auto',
    sensitivity: 'high',
    ...options,
  });
}

/**
 * Helper to compress student portrait photos (JPEG/WebP)
 */
export async function compressStudentPhoto(
  source: File | string,
  maxWidth = 400,
  maxHeight = 520
): Promise<string> {
  return compressImage(source, {
    maxWidth,
    maxHeight,
    quality: 0.85,
    mimeType: 'image/jpeg',
  });
}

export interface LogoTransparencyOptions {
  tolerance?: number; // 0-100 color distance tolerance (default 38)
  feather?: number; // edge transition smoothness (default 14)
  autoCrop?: boolean;
  maxDimension?: number;
}

/**
 * Automatically and intelligently removes background (white, off-white, light gray, solid canvas, or photo paper)
 * from logos, photos, and icons using an outer-boundary BFS flood-fill algorithm.
 * Preserves interior white shapes, smooths edges with anti-aliasing, and returns a crystal-clear transparent PNG.
 */
export async function makeLogoTransparent(
  source: File | Blob | string,
  options: LogoTransparencyOptions = {}
): Promise<string> {
  const {
    tolerance = 42,
    feather = 16,
    autoCrop = true,
    maxDimension = 512,
  } = options;

  return new Promise((resolve) => {
    const processImg = (img: HTMLImageElement) => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          return resolve(typeof source === 'string' ? source : '');
        }

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          return resolve(typeof source === 'string' ? source : '');
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const totalPixels = width * height;

        // Check existing transparency
        let transparentPixelCount = 0;
        for (let i = 0; i < totalPixels; i++) {
          if (data[i * 4 + 3] < 50) {
            transparentPixelCount++;
          }
        }
        const hasHighExistingTransparency = (transparentPixelCount / totalPixels) > 0.15;

        if (hasHighExistingTransparency) {
          // Clean up faint white halos around transparent border if any
          for (let i = 0; i < totalPixels; i++) {
            const off = i * 4;
            const a = data[off + 3];
            if (a === 0) continue;
            const r = data[off];
            const g = data[off + 1];
            const b = data[off + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            const sat = Math.max(r, g, b) - Math.min(r, g, b);
            if (lum > 240 && sat < 18 && a < 230) {
              data[off + 3] = 0;
            }
          }
        } else {
          // 1. Sample corners & perimeter borders to estimate background color variations
          let edgeR = 0, edgeG = 0, edgeB = 0, edgeCount = 0;
          const cornerColors: Array<[number, number, number]> = [];

          // Sample 4 corner patches
          const cornerSize = Math.min(6, Math.floor(Math.min(width, height) / 4));
          const sampleCorner = (startX: number, startY: number) => {
            let cr = 0, cg = 0, cb = 0, cc = 0;
            for (let y = startY; y < startY + cornerSize && y < height; y++) {
              for (let x = startX; x < startX + cornerSize && x < width; x++) {
                const off = (y * width + x) * 4;
                cr += data[off];
                cg += data[off + 1];
                cb += data[off + 2];
                cc++;
              }
            }
            if (cc > 0) {
              cornerColors.push([cr / cc, cg / cc, cb / cc]);
            }
          };

          sampleCorner(0, 0);
          sampleCorner(Math.max(0, width - cornerSize), 0);
          sampleCorner(0, Math.max(0, height - cornerSize));
          sampleCorner(Math.max(0, width - cornerSize), Math.max(0, height - cornerSize));

          // Sample outer perimeter
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              if (x <= 2 || x >= width - 3 || y <= 2 || y >= height - 3) {
                const off = (y * width + x) * 4;
                edgeR += data[off];
                edgeG += data[off + 1];
                edgeB += data[off + 2];
                edgeCount++;
              }
            }
          }

          const avgBgR = edgeCount > 0 ? edgeR / edgeCount : 255;
          const avgBgG = edgeCount > 0 ? edgeG / edgeCount : 255;
          const avgBgB = edgeCount > 0 ? edgeB / edgeCount : 255;
          const avgBgLum = 0.299 * avgBgR + 0.587 * avgBgG + 0.114 * avgBgB;
          const isLightBg = avgBgLum > 175;

          // 2. BFS Flood Fill from outer boundaries
          const isBackground = new Uint8Array(totalPixels);
          const queueX = new Int32Array(totalPixels);
          const queueY = new Int32Array(totalPixels);
          let head = 0;
          let tail = 0;

          const testAndEnqueue = (x: number, y: number) => {
            const idx = y * width + x;
            if (isBackground[idx] !== 0) return;
            const off = idx * 4;
            const r = data[off];
            const g = data[off + 1];
            const b = data[off + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            const sat = Math.max(r, g, b) - Math.min(r, g, b);
            
            // Distance to global average background
            const distAvg = Math.sqrt((r - avgBgR) ** 2 + (g - avgBgG) ** 2 + (b - avgBgB) ** 2);
            
            // Distance to closest corner background
            let minCornerDist = distAvg;
            for (let c = 0; c < cornerColors.length; c++) {
              const [cR, cG, cB] = cornerColors[c];
              const d = Math.sqrt((r - cR) ** 2 + (g - cG) ** 2 + (b - cB) ** 2);
              if (d < minCornerDist) minCornerDist = d;
            }

            const isMatch = isLightBg
              ? minCornerDist <= tolerance || distAvg <= tolerance || (lum >= 220 && sat <= 24) || (lum >= avgBgLum - 30 && sat <= 32 && minCornerDist <= tolerance * 1.4)
              : minCornerDist <= tolerance || distAvg <= tolerance;

            if (isMatch) {
              isBackground[idx] = 1;
              queueX[tail] = x;
              queueY[tail] = y;
              tail++;
            }
          };

          // Seed all outer edges
          for (let x = 0; x < width; x++) {
            testAndEnqueue(x, 0);
            testAndEnqueue(x, height - 1);
          }
          for (let y = 0; y < height; y++) {
            testAndEnqueue(0, y);
            testAndEnqueue(width - 1, y);
          }

          // Expand flood fill
          while (head < tail) {
            const cx = queueX[head];
            const cy = queueY[head];
            head++;

            // 4-neighborhood
            const neighbors = [
              [cx + 1, cy],
              [cx - 1, cy],
              [cx, cy + 1],
              [cx, cy - 1]
            ];

            for (let n = 0; n < 4; n++) {
              const nx = neighbors[n][0];
              const ny = neighbors[n][1];
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                testAndEnqueue(nx, ny);
              }
            }
          }

          // 3. Apply transparency and smooth anti-aliased feathering to edges
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = y * width + x;
              const off = idx * 4;

              if (isBackground[idx] === 1) {
                data[off + 3] = 0; // Pure transparent background
              } else {
                // Check if adjacent to background for soft anti-aliased edge
                const r = data[off];
                const g = data[off + 1];
                const b = data[off + 2];
                const dist = Math.sqrt((r - avgBgR) ** 2 + (g - avgBgG) ** 2 + (b - avgBgB) ** 2);

                let isNearBg = false;
                if (
                  (x > 0 && isBackground[idx - 1] === 1) ||
                  (x < width - 1 && isBackground[idx + 1] === 1) ||
                  (y > 0 && isBackground[idx - width] === 1) ||
                  (y < height - 1 && isBackground[idx + width] === 1)
                ) {
                  isNearBg = true;
                }

                if (isNearBg && dist < tolerance + feather) {
                  const factor = Math.max(0, Math.min(1, (dist - (tolerance * 0.65)) / (tolerance * 0.35 + feather)));
                  const newAlpha = Math.round(factor * 255);
                  data[off + 3] = Math.min(data[off + 3], newAlpha);

                  // De-fringe light background bleed from edge
                  if (isLightBg && avgBgLum > 180) {
                    data[off] = Math.max(0, Math.round(r * 0.88));
                    data[off + 1] = Math.max(0, Math.round(g * 0.88));
                    data[off + 2] = Math.max(0, Math.round(b * 0.88));
                  }
                }
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // 4. Auto-crop transparent margins if enabled
        if (autoCrop) {
          let minX = width, minY = height, maxX = 0, maxY = 0;
          let hasVisible = false;

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const off = (y * width + x) * 4;
              if (data[off + 3] > 18) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
                hasVisible = true;
              }
            }
          }

          if (hasVisible && maxX > minX && maxY > minY) {
            const pad = 8;
            const cropX = Math.max(0, minX - pad);
            const cropY = Math.max(0, minY - pad);
            const cropW = Math.min(width - cropX, (maxX - minX) + (pad * 2));
            const cropH = Math.min(height - cropY, (maxY - minY) + (pad * 2));

            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = Math.max(1, cropW);
            cropCanvas.height = Math.max(1, cropH);
            const cropCtx = cropCanvas.getContext('2d');
            if (cropCtx) {
              cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
              return resolve(cropCanvas.toDataURL('image/png'));
            }
          }
        }

        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Logo transparency error, falling back to source:', err);
        resolve(typeof source === 'string' ? source : '');
      }
    };

    // Safe load
    if (typeof source === 'string') {
      const img = new Image();
      if (source.startsWith('http://') || source.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => processImg(img);
      img.onerror = () => resolve(source);
      img.src = source;
    } else if (source && typeof source === 'object') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawUrl = e.target?.result as string;
        if (!rawUrl) return resolve('');
        const img = new Image();
        img.onload = () => processImg(img);
        img.onerror = () => resolve(rawUrl);
        img.src = rawUrl;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(source as Blob);
    } else {
      resolve('');
    }
  });
}

/**
 * Helper to process and make Page Loader Logo uploads automatically transparent PNGs
 */
export async function processPageLoaderLogoUpload(
  source: File | Blob | string,
  options?: Partial<LogoTransparencyOptions>
): Promise<string> {
  return makeLogoTransparent(source, {
    tolerance: 42,
    feather: 16,
    autoCrop: true,
    maxDimension: 512,
    ...options,
  });
}

