import React, { useEffect, useState } from 'react';
import { CardConfig, MadrasahInfo, Student } from '../types';
import { THEME_CONFIGS } from '../constants/initialData';
import { BarcodeSvg, HologramBadge, IslamicWatermark, KemenagLogo, MadrasahLogo } from './Logos';
import { generateQrDataUrl, buildVCardString } from '../utils/exportUtils';
import { ShieldCheck } from 'lucide-react';

interface CardFrontProps {
  student: Student;
  madrasah: MadrasahInfo;
  config: CardConfig;
  elementId?: string;
  scale?: number;
}

export const CardFront: React.FC<CardFrontProps> = ({
  student,
  madrasah,
  config,
  elementId = 'card-front-preview',
  scale = 1
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const theme = THEME_CONFIGS[config.theme] || THEME_CONFIGS['kemenag-green'];
  const isLandscape = config.orientation === 'landscape';

  // Calculate logo visibility & source based on config.logoMode and singleLogoSource
  // Determine if left (Kemenag) logo is active
  const isLeftActive = (config.showKemenagLogo !== false) && config.logoMode !== 'right_only' && config.logoMode !== 'madrasah_only' && config.logoMode !== 'none';
  // Determine if right (Madrasah) logo is active
  const isRightActive = (config.showMadrasahLogo !== false) && config.logoMode !== 'left_only' && config.logoMode !== 'kemenag_only' && config.logoMode !== 'none';

  const showLeftLogo = isLeftActive;
  const showRightLogo = isRightActive;

  // Determine what image to render on the left
  const isLeftSingleMadrasah = config.logoMode === 'left_only' && config.singleLogoSource === 'madrasah';
  const leftLogoUrl = isLeftSingleMadrasah
    ? (madrasah.logoMadrasahUrl || madrasah.logoAplikasiUrl)
    : (madrasah.logoKemenagUrl || madrasah.logoAplikasiUrl);
  const renderLeftLogoComponent = () => {
    if (leftLogoUrl) {
      return (
        <img
          src={leftLogoUrl}
          alt="Logo Kiri"
          className="w-10 h-10 object-contain drop-shadow"
          crossOrigin={leftLogoUrl.startsWith('data:') ? undefined : 'anonymous'}
        />
      );
    }
    return isLeftSingleMadrasah ? (
      <MadrasahLogo className="w-10 h-10 drop-shadow" />
    ) : (
      <KemenagLogo className="w-10 h-10 drop-shadow" />
    );
  };

  // Determine what image to render on the right
  const isRightSingleKemenag = config.logoMode === 'right_only' && config.singleLogoSource === 'kemenag';
  const rightLogoUrl = isRightSingleKemenag
    ? (madrasah.logoKemenagUrl || madrasah.logoAplikasiUrl)
    : (madrasah.logoMadrasahUrl || madrasah.logoAplikasiUrl);
  const renderRightLogoComponent = () => {
    if (rightLogoUrl) {
      return (
        <img
          src={rightLogoUrl}
          alt="Logo Kanan"
          className="w-10 h-10 object-contain drop-shadow"
          crossOrigin={rightLogoUrl.startsWith('data:') ? undefined : 'anonymous'}
        />
      );
    }
    return isRightSingleKemenag ? (
      <KemenagLogo className="w-10 h-10 drop-shadow" />
    ) : (
      <MadrasahLogo className="w-10 h-10 drop-shadow" />
    );
  };

  useEffect(() => {
    let qrData = student.nisn;
    if (config.qrContent === 'verification_url') {
      qrData = config.customQrUrl || `https://emis.kemenag.go.id/siswa/verify?nisn=${student.nisn}&npsn=${madrasah.npsn}`;
    } else if (config.qrContent === 'vcard') {
      qrData = buildVCardString(student, madrasah);
    } else if (config.qrContent === 'nis') {
      qrData = student.nis;
    }

    generateQrDataUrl(qrData).then(setQrCodeUrl);
  }, [student, madrasah, config.qrContent, config.customQrUrl]);

  return (
    <div
      id={elementId}
      className={`card-pixel-exact relative select-none overflow-hidden bg-white text-slate-800 shadow-xl border border-slate-300 ${config.cardRadius} transition-all duration-300`}
      style={{
        width: isLandscape ? '500px' : '330px',
        height: isLandscape ? '315px' : '480px',
        minWidth: isLandscape ? '500px' : '330px',
        minHeight: isLandscape ? '315px' : '480px',
        boxSizing: 'border-box',
        WebkitFontSmoothing: 'antialiased',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      {/* Background Watermark & Subtle Islamic Security Pattern */}
      <IslamicWatermark pattern={config.watermark} className="text-emerald-950/10 absolute inset-0" />

      {/* Outer border micro-accent */}
      <div className="absolute inset-0 border-[3px] border-emerald-700/30 rounded-inherit pointer-events-none z-20" />

      {/* CARD HEADER */}
      <div className={`relative z-10 px-3 py-2 ${theme.headerBg} text-white flex items-center justify-between shadow-sm border-b-2 ${theme.headerAccent}`}>
        {/* Left: Kemenag / Primary Logo */}
        {showLeftLogo ? (
          <div className="flex-shrink-0 flex items-center justify-center">
            {renderLeftLogoComponent()}
          </div>
        ) : (
          /* Balance spacer if right logo exists but left is hidden to keep text centered */
          showRightLogo && <div className="w-10 h-10 flex-shrink-0 opacity-0 pointer-events-none" />
        )}

        {/* Center: Madrasah Titles */}
        <div className="flex-1 text-center px-2 min-w-0">
          {(config.showNamaKementerian ?? true) && (
            <p className="text-[7.5px] font-bold tracking-wider text-amber-200 uppercase leading-tight truncate">
              {madrasah.namaKementerian || madrasah.kemenagWilayah || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'}
            </p>
          )}
          <h2 className="text-[11.5px] font-extrabold tracking-wide uppercase text-white leading-tight font-sans drop-shadow-sm truncate">
            {madrasah.namaMadrasah}
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-[6.8px] text-emerald-100/90 font-medium leading-none mt-0.5">
            <span>NSM: <strong className="text-amber-300 font-mono">{madrasah.nsm}</strong></span>
            <span>•</span>
            <span>NPSN: <strong className="text-amber-300 font-mono">{madrasah.npsn}</strong></span>
            {madrasah.akreditasi && madrasah.akreditasi !== '-' && (
              <>
                <span>•</span>
                <span className="bg-amber-400/90 text-emerald-950 font-bold px-1 rounded-[2px] text-[6px]">
                  AKR: {madrasah.akreditasi}
                </span>
              </>
            )}
          </div>
          <p className="text-[6.2px] text-slate-200/90 truncate leading-tight mt-0.5 max-w-[280px] mx-auto">
            {madrasah.alamat}, {madrasah.kotaKab} - Telp: {madrasah.telepon}
          </p>
        </div>

        {/* Right: Madrasah / Secondary Logo */}
        {showRightLogo ? (
          <div className="flex-shrink-0 flex items-center justify-center">
            {renderRightLogoComponent()}
          </div>
        ) : (
          /* Balance spacer if left logo exists but right is hidden to keep text centered */
          showLeftLogo && <div className="w-10 h-10 flex-shrink-0 opacity-0 pointer-events-none" />
        )}
      </div>

      {/* SUB-HEADER RIBBON: KARTU TANDA PELAJAR */}
      <div className="relative z-10 flex items-center justify-center bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 py-0.5 shadow-sm">
        <div className="flex items-center gap-1 text-[8.5px] font-extrabold tracking-widest text-emerald-950 uppercase">
          <ShieldCheck className="w-3 h-3 text-emerald-900" />
          <span>KARTU TANDA PELAJAR MI</span>
          <span className="text-[7px] font-normal tracking-normal text-emerald-900/80">
            (TP. {madrasah.tahunPelajaran || student.tahunAjaran || '2025/2026'})
          </span>
        </div>
      </div>

      {/* CARD BODY CONTENT */}
      {isLandscape ? (
        /* LANDSCAPE LAYOUT */
        <div className="relative z-10 p-3 flex gap-3.5 items-center justify-between h-[196px]">
          {/* Left Column: Photo & Barcode */}
          <div className="flex flex-col items-center justify-between h-full w-[112px] flex-shrink-0">
            {/* Student Photo */}
            <div className="relative group">
              <div className="w-[82px] h-[104px] rounded-md overflow-hidden bg-gradient-to-b from-blue-600 to-red-600 p-[2px] shadow-md border border-amber-300">
                <img
                  src={student.fotoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&fit=crop'}
                  alt={student.nama}
                  className="w-full h-full object-cover rounded-[3px] bg-slate-100"
                  crossOrigin={student.fotoUrl && !student.fotoUrl.startsWith('data:') ? 'anonymous' : undefined}
                />
              </div>

              {/* Hologram Badge positioned on photo corner */}
              {config.showHologram && (
                <div className="absolute -bottom-1.5 -right-1.5 z-20">
                  <HologramBadge className="w-6 h-6 shadow-md" />
                </div>
              )}
            </div>

            {/* Barcode under photo */}
            {config.showBarcode && (
              <div className="w-full mt-auto pt-1 bg-white/90 px-1 py-0.5 rounded border border-slate-200/80 shadow-xs">
                <BarcodeSvg
                  value={config.barcodeType === 'nisn' ? student.nisn : student.nis}
                  height={20}
                />
              </div>
            )}
          </div>

          {/* Center Column: Biodata Fields */}
          <div className="flex-1 flex flex-col justify-between h-full min-w-0 pr-1">
            <div className="space-y-1">
              {/* Student Name */}
              <div className="border-b border-emerald-600/30 pb-0.5 mb-1">
                <p className="text-[12px] font-black text-emerald-950 uppercase tracking-tight leading-tight line-clamp-1">
                  {student.nama}
                </p>
                <div className="flex items-center gap-2 text-[8px] text-emerald-800 font-semibold">
                  <span>NISN: <strong className="font-mono text-emerald-950">{student.nisn}</strong></span>
                  <span>|</span>
                  <span>NIS: <strong className="font-mono text-emerald-950">{student.nis}</strong></span>
                </div>
              </div>

              {/* Detail Table */}
              <div className="grid grid-cols-[70px_6px_1fr] gap-y-0.5 text-[8.2px] leading-tight text-slate-700">
                <span className="font-medium text-slate-500">Tempat, Tgl Lahir</span>
                <span>:</span>
                <span className="font-semibold text-slate-900 truncate">
                  {student.tempatLahir}, {student.tanggalLahir}
                </span>

                <span className="font-medium text-slate-500">Jenis Kelamin</span>
                <span>:</span>
                <span className="font-semibold text-slate-900">
                  {student.jenisKelamin === 'L' ? 'Laki-laki (Ikhwan)' : 'Perempuan (Akhwat)'}
                </span>

                <span className="font-medium text-slate-500">Kelas / Rombel</span>
                <span>:</span>
                <span className="font-bold text-emerald-900">
                  {student.kelas}
                </span>

                {config.showBloodType && student.golonganDarah && (
                  <>
                    <span className="font-medium text-slate-500">Gol. Darah</span>
                    <span>:</span>
                    <span className="font-semibold text-slate-900">{student.golonganDarah}</span>
                  </>
                )}

                {config.showAddress && (
                  <>
                    <span className="font-medium text-slate-500">Alamat</span>
                    <span>:</span>
                    <span className="font-semibold text-slate-800 line-clamp-1">
                      {student.alamat}
                    </span>
                  </>
                )}

                {config.showParentName && student.namaWali && (
                  <>
                    <span className="font-medium text-slate-500">Orang Tua/Wali</span>
                    <span>:</span>
                    <span className="font-semibold text-slate-800 truncate">
                      {student.namaWali}
                    </span>
                  </>
                )}

                {config.showExpiryDate && (
                  <>
                    <span className="font-medium text-slate-500">Masa Berlaku</span>
                    <span>:</span>
                    <span className="font-bold text-emerald-700">
                      {student.berlakuSampai}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Row inside landscape card */}
            <div className="flex items-end justify-between pt-1 border-t border-slate-200 mt-auto">
              <p className="text-[6.5px] italic text-slate-500 max-w-[200px] leading-tight">
                * {madrasah.motto || 'Madrasah Mandiri Berprestasi'}
              </p>
              
              {/* Small QR Code on bottom right if enabled */}
              {config.showQrCode && qrCodeUrl && (
                <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-slate-200 shadow-xs">
                  <img src={qrCodeUrl} alt="QR Code" className="w-10 h-10 object-contain" />
                  <div className="text-[5.5px] text-slate-500 leading-tight font-mono">
                    <p className="font-bold text-emerald-800">SCAN</p>
                    <p>VERIFIKASI</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* PORTRAIT LAYOUT */
        <div className="relative z-10 p-3 flex flex-col justify-between h-[360px]">
          {/* Top Section: Photo + Main Info */}
          <div className="flex flex-col items-center text-center">
            {/* Student Photo */}
            <div className="relative mb-2">
              <div className="w-[84px] h-[106px] rounded-md overflow-hidden bg-gradient-to-b from-blue-600 to-red-600 p-[2px] shadow-md border border-amber-300">
                <img
                  src={student.fotoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&fit=crop'}
                  alt={student.nama}
                  className="w-full h-full object-cover rounded-[3px] bg-slate-100"
                  crossOrigin={student.fotoUrl && !student.fotoUrl.startsWith('data:') ? 'anonymous' : undefined}
                />
              </div>

              {config.showHologram && (
                <div className="absolute -bottom-1 -right-1 z-20">
                  <HologramBadge className="w-6 h-6 shadow-md" />
                </div>
              )}
            </div>

            <h3 className="text-[12px] font-black text-emerald-950 uppercase tracking-tight leading-tight line-clamp-1">
              {student.nama}
            </h3>
            <p className="text-[8.5px] font-bold text-emerald-800 font-mono mt-0.5">
              NISN: {student.nisn} / NIS: {student.nis}
            </p>
          </div>

          {/* Detail List */}
          <div className="bg-slate-50/80 rounded-md p-2 border border-slate-200/80 my-1 space-y-1 text-[8px] leading-tight">
            <div className="flex justify-between">
              <span className="text-slate-500">TTL:</span>
              <span className="font-semibold text-slate-900 truncate max-w-[170px]">
                {student.tempatLahir}, {student.tanggalLahir}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kelas:</span>
              <span className="font-bold text-emerald-900">{student.kelas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Alamat:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[170px]">{student.alamat}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Berlaku:</span>
              <span className="font-bold text-emerald-700">{student.berlakuSampai}</span>
            </div>
          </div>

          {/* Barcode & QR footer */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 mt-auto">
            {config.showBarcode && (
              <div className="flex-1">
                <BarcodeSvg value={student.nisn} height={18} />
              </div>
            )}
            {config.showQrCode && qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" className="w-10 h-10 object-contain border border-slate-200 p-0.5 rounded bg-white" />
            )}
          </div>
        </div>
      )}

      {/* FOOTER BAR STRIP */}
      <div className={`absolute bottom-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-800 via-amber-500 to-emerald-800 z-10`} />
    </div>
  );
};
