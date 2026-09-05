import React, { useEffect, useState } from 'react';
import { CardConfig, MadrasahInfo, Student } from '../types';
import { BACK_CONTENT_PRESETS, THEME_CONFIGS } from '../constants/initialData';
import { IslamicWatermark, KemenagLogo, MadrasahLogo, OfficialStamp, PrincipalSignature } from './Logos';
import { generateQrDataUrl, buildVCardString } from '../utils/exportUtils';
import { BookOpen, CheckCircle2 } from 'lucide-react';

interface CardBackProps {
  student: Student;
  madrasah: MadrasahInfo;
  config: CardConfig;
  elementId?: string;
  scale?: number;
}

export const CardBack: React.FC<CardBackProps> = ({
  student,
  madrasah,
  config,
  elementId = 'card-back-preview',
  scale = 1
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const theme = THEME_CONFIGS[config.theme] || THEME_CONFIGS['kemenag-green'];
  const isLandscape = config.orientation === 'landscape';

  const presetData = BACK_CONTENT_PRESETS[config.backContentPreset] || BACK_CONTENT_PRESETS['tata-tertib'];
  const title = config.backContentPreset === 'custom' ? config.customBackTitle : presetData.title;
  const items = config.backContentPreset === 'custom' ? config.customBackNotes : presetData.items;

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
      className={`card-pixel-exact relative select-none overflow-hidden bg-white text-slate-800 shadow-xl border border-slate-300 ${config.cardRadius} transition-all duration-300 flex flex-col justify-between`}
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
      {/* Background Watermark */}
      <IslamicWatermark pattern={config.watermark} className="text-emerald-950/10 absolute inset-0" />

      {/* Outer border micro-accent */}
      <div className="absolute inset-0 border-[3px] border-emerald-700/30 rounded-inherit pointer-events-none z-20" />

      {/* TOP HEADER */}
      <div className={`relative z-10 px-3 py-1.5 ${theme.headerBg} text-white flex items-center justify-between shadow-xs border-b ${theme.headerAccent}`}>
        <div className="flex items-center gap-1.5">
          {(() => {
            const isLeftActive = (config.showKemenagLogo !== false) && config.logoMode !== 'right_only' && config.logoMode !== 'madrasah_only' && config.logoMode !== 'none';
            const isRightActive = (config.showMadrasahLogo !== false) && config.logoMode !== 'left_only' && config.logoMode !== 'kemenag_only' && config.logoMode !== 'none';

            if (!isLeftActive && !isRightActive) return null;

            let chosenLogoUrl = '';
            if (isRightActive && (!isLeftActive || config.singleLogoSource === 'madrasah')) {
              chosenLogoUrl = madrasah.logoMadrasahUrl || madrasah.logoAplikasiUrl || '';
            } else if (isLeftActive) {
              chosenLogoUrl = madrasah.logoKemenagUrl || madrasah.logoAplikasiUrl || '';
            }

            if (chosenLogoUrl) {
              return (
                <img
                  src={chosenLogoUrl}
                  alt="Logo"
                  className="w-5 h-5 object-contain drop-shadow"
                  crossOrigin={chosenLogoUrl.startsWith('data:') ? undefined : 'anonymous'}
                />
              );
            }
            return isRightActive && !isLeftActive ? (
              <MadrasahLogo className="w-5 h-5 drop-shadow" />
            ) : isLeftActive ? (
              <KemenagLogo className="w-5 h-5 drop-shadow" />
            ) : null;
          })()}
          <span className="text-[9px] font-bold tracking-wider text-amber-300 uppercase truncate max-w-[280px]">
            {madrasah.namaMadrasahKop || madrasah.namaMadrasah}
          </span>
        </div>
        <span className="text-[7.5px] font-semibold text-emerald-100 uppercase tracking-wider font-mono">
          NSM: {madrasah.nsm}
        </span>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="relative z-10 p-3 flex-1 flex flex-col justify-between overflow-hidden">
        {/* Title Header */}
        <div className="flex items-center gap-1.5 border-b border-emerald-600/30 pb-1 mb-1.5">
          <BookOpen className="w-3 h-3 text-emerald-700 flex-shrink-0" />
          <h4 className="text-[8.8px] font-extrabold uppercase tracking-wide text-emerald-950">
            {title}
          </h4>
        </div>

        {/* Ordered Rules List */}
        <div className="space-y-1 my-auto">
          {items.slice(0, isLandscape ? 5 : 4).map((rule, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-[7.5px] leading-snug text-slate-700">
              <span className="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[6.5px] flex items-center justify-center border border-emerald-300 mt-0.5">
                {idx + 1}
              </span>
              <span className="flex-1 font-medium">{rule}</span>
            </div>
          ))}
        </div>

        {/* SIGNATURE & QR CODE FOOTER */}
        <div className="pt-2 border-t border-slate-200 mt-auto flex items-end justify-between">
          {/* Left: QR Code Verifikasi */}
          <div className="flex items-center gap-2">
            {qrCodeUrl && (
              <div className="bg-white p-1 rounded border border-slate-300 shadow-xs flex items-center gap-1.5">
                <img src={qrCodeUrl} alt="QR Verifikasi" className="w-12 h-12 object-contain" />
                <div className="text-[6.5px] text-slate-600 leading-tight">
                  <p className="font-bold text-emerald-900 flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> RESMI
                  </p>
                  <p className="font-mono text-[5.5px]">VERIFIKASI EMIS</p>
                  <p className="text-[5px] text-slate-400">NISN: {student.nisn}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Signature & Stamp Box */}
          <div className="text-center relative min-w-[170px]">
            <p className="text-[7.2px] text-slate-600 leading-tight">
              Ditetapkan di: <strong className="text-slate-800">{madrasah.kotaPenetapan}</strong>
            </p>
            <p className="text-[7.2px] text-slate-600 leading-tight">
              Pada tanggal: <strong className="text-slate-800">{madrasah.tanggalPenetapan}</strong>
            </p>
            <p className="text-[7.5px] font-bold text-emerald-950 uppercase mt-0.5 leading-tight">
              {madrasah.jabatanPenandatangan || 'Kepala Madrasah'},
            </p>

            {/* Signature & Stamp Overlapping Layer */}
            <div className="h-10 relative flex items-center justify-center my-0.5">
              {/* Stamp */}
              {config.showStamp && (
                <div className="absolute -left-1 top-[-10px] z-10 pointer-events-none">
                  {madrasah.stempelUrl ? (
                    <img
                      src={madrasah.stempelUrl}
                      alt="Stempel Madrasah"
                      className="w-18 h-18 object-contain opacity-85 transform -rotate-12 mix-blend-multiply"
                    />
                  ) : (
                    <OfficialStamp
                      schoolName={madrasah.namaMadrasah}
                      location={madrasah.kotaKab}
                      className="w-18 h-18"
                    />
                  )}
                </div>
              )}

              {/* Principal Signature */}
              {config.showSignature && (
                <div className="relative z-0 pointer-events-none pl-3">
                  {madrasah.ttdKepalaUrl ? (
                    <img
                      src={madrasah.ttdKepalaUrl}
                      alt="Tanda Tangan Penandatangan"
                      className="w-24 h-10 object-contain"
                    />
                  ) : (
                    <PrincipalSignature className="w-24 h-10" />
                  )}
                </div>
              )}
            </div>

            {/* Signatory Name & Identification Number */}
            <p className="text-[8px] font-extrabold text-slate-900 underline leading-tight tracking-tight min-h-[12px]">
              {madrasah.namaKepalaMadrasah || '...........................................'}
            </p>
            <p className="text-[6.8px] font-mono text-slate-600 leading-tight">
              {madrasah.labelIdPenandatangan ? `${madrasah.labelIdPenandatangan}. ` : 'NIP. '}
              {madrasah.nipKepalaMadrasah || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER BAR STRIP */}
      <div className="relative z-10 px-3 py-0.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[6px] text-slate-500">
        <span className="truncate">
          Alamat: {madrasah.alamat}, {madrasah.kotaKab} - Email: {madrasah.email}
        </span>
        <span className="font-mono text-emerald-800 font-bold uppercase">
          KARTU PELAJAR RESMI MI
        </span>
      </div>
    </div>
  );
};
