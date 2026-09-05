import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Student, MadrasahInfo } from '../types';

/**
 * Cross-browser font & asset readiness helper.
 * Guarantees that custom fonts (Plus Jakarta Sans, Amiri, Cinzel) and images
 * are fully rasterized across Safari, Chrome, Firefox, and Edge before export.
 */
export const ensureFontsAndImagesReady = async (): Promise<void> => {
  if (typeof document !== 'undefined') {
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
        // ignore font ready errors
      }
    }
  }
  // Small tick to ensure subpixel text layout has settled across all rendering engines
  await new Promise((resolve) => setTimeout(resolve, 80));
};

export const generateQrDataUrl = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 256,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
};

export const downloadCardElementAsPng = async (
  elementId: string,
  filename: string
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    await ensureFontsAndImagesReady();

    // Cross-browser high DPI capture with Safari fallback
    const renderOptions = {
      quality: 0.98,
      pixelRatio: 3, // High DPI export for 300dpi printing
      cacheBust: true,
      backgroundColor: '#ffffff',
    };

    let dataUrl: string;
    try {
      dataUrl = await toPng(element, renderOptions);
    } catch (firstErr) {
      // Safari/WebKit fallback retry after slight delay
      await new Promise((r) => setTimeout(r, 120));
      dataUrl = await toPng(element, renderOptions);
    }

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading card PNG:', error);
    alert('Gagal mengunduh kartu. Silakan gunakan opsi Cetak Langsung / Print.');
  }
};

export const generateSingleStudentPdf = async (
  frontElementId: string,
  backElementId: string,
  studentName: string,
  nisn: string
): Promise<void> => {
  const frontEl = document.getElementById(frontElementId);
  const backEl = document.getElementById(backElementId);

  if (!frontEl || !backEl) {
    alert('Komponen kartu belum siap untuk diekspor ke PDF');
    return;
  }

  try {
    await ensureFontsAndImagesReady();

    const renderOpts = { pixelRatio: 3, backgroundColor: '#ffffff', cacheBust: true };
    const frontImg = await toPng(frontEl, renderOpts);
    const backImg = await toPng(backEl, renderOpts);

    // Standard CR80 ID Card dimensions: 85.6mm x 53.98mm (Landscape)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [85.6, 54],
    });

    // Page 1: Front
    doc.addImage(frontImg, 'PNG', 0, 0, 85.6, 54);

    // Page 2: Back
    doc.addPage([85.6, 54], 'landscape');
    doc.addImage(backImg, 'PNG', 0, 0, 85.6, 54);

    doc.save(`KARTU_PELAJAR_MI_${studentName.replace(/\s+/g, '_')}_${nisn}.pdf`);
  } catch (err) {
    console.error('Error generating PDF:', err);
    alert('Gagal menghasilkan file PDF. Anda dapat menggunakan opsi cetak.');
  }
};

export const buildVCardString = (student: Student, madrasah: MadrasahInfo): string => {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${student.nama}`,
    `ORG:${madrasah.namaMadrasah}`,
    `TITLE:Siswa Madrasah Ibtidaiyah Kelas ${student.kelas}`,
    `NOTE:NISN: ${student.nisn} | NIS: ${student.nis} | TTL: ${student.tempatLahir}, ${student.tanggalLahir}`,
    `ADR;TYPE=HOME:;;${student.alamat};${madrasah.kotaKab};${madrasah.provinsi};;Indonesia`,
    `TEL;TYPE=WORK:${madrasah.telepon}`,
    `EMAIL;TYPE=WORK:${madrasah.email}`,
    `URL:${madrasah.website}`,
    'END:VCARD'
  ].join('\n');
};
