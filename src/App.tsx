import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CardConfig, 
  MadrasahInfo, 
  Student, 
  StudentImportMode,
  AdminUser, 
  ActivityLog,
  PageLoaderConfig 
} from './types';
import { 
  INITIAL_CARD_CONFIG, 
  INITIAL_MADRASAH, 
  INITIAL_STUDENTS,
  DEFAULT_EMPTY_STUDENT,
  SAMPLE_STUDENT,
  INITIAL_LOADER_CONFIG
} from './constants/initialData';
import { Card3DPreview } from './components/Card3DPreview';
import { StudentForm } from './components/StudentForm';
import { MadrasahForm } from './components/MadrasahForm';
import { DesignSettings } from './components/DesignSettings';
import { BatchStudentManager } from './components/BatchStudentManager';
import { PrintSheetModal } from './components/PrintSheetModal';
import { CardScannerModal } from './components/CardScannerModal';
import { PleskExportModal } from './components/PleskExportModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminHeaderBar } from './components/AdminHeaderBar';
import { ActivityLogModal } from './components/ActivityLogModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { AdminDashboardView } from './components/AdminDashboardView';
import { SignaturePadModal } from './components/SignaturePadModal';
import { EmisExcelImportModal } from './components/EmisExcelImportModal';
import { SuratKeteranganAktifModal } from './components/SuratKeteranganAktifModal';
import { InitialPageLoader, ActionProcessingOverlay } from './components/PageLoader';
import { PageLoaderSettingsModal } from './components/PageLoaderSettingsModal';
import { KemenagLogo } from './components/Logos';
import { setPersistentItem, getPersistentItem, getPersistentTimestamp, hasUserCustomData, saveToPermanentVault, restoreFromPermanentVault, purgeMockStudents, clearAllLocalCaches } from './utils/storageUtils';
import { fetchServerCentralState, saveServerCentralState, fetchServerVersion, fetchDatabaseHealth, getLiveStreamEndpoint } from './utils/apiUtils';
import { 
  User, 
  Building2, 
  Palette, 
  Users, 
  Sparkles, 
  Layers, 
  HelpCircle, 
  CheckCircle2, 
  FileBadge, 
  Server, 
  Lock, 
  Unlock, 
  ShieldAlert, 
  LogIn, 
  LayoutDashboard, 
  CreditCard, 
  FileSpreadsheet, 
  PenTool, 
  FileText,
  QrCode,
  Eye,
  Printer,
  Database,
  History,
  GraduationCap
} from 'lucide-react';


const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    action: 'Inisialisasi Sistem Kartu MI',
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    operator: 'Sistem Kemenag',
    details: 'Database siswa awal, profil madrasah, dan format cetak CR80 dimuat.',
    type: 'create',
  },
];

export default function App() {
  // Page Loader State
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(15);
  const [loadingStatus, setLoadingStatus] = useState<string>('Memulai Sistem Kartu Pelajar MI...');

  // Active Main View: 'card_editor' vs 'admin_dashboard'
  const [currentView, setCurrentView] = useState<'card_editor' | 'admin_dashboard'>('card_editor');

  // Core Data State (with multi-layer localStorage & backup vault)
  const [students, setStudents] = useState<Student[]>(() => {
    // 1. Prioritaskan data siswa tersimpan di permanent vault browser (Anti-timpa saat update ZIP)
    if (typeof window !== 'undefined') {
      try {
        const vRaw = localStorage.getItem('mi_permanent_vault_students');
        if (vRaw) {
          const vParsed = JSON.parse(vRaw);
          const vList = vParsed?.data || vParsed;
          const cleanVault = purgeMockStudents(vList);
          if (cleanVault.length > 0) return cleanVault;
        }
      } catch (e) {}
    }

    // 2. Cek primary key di localStorage
    const saved = typeof window !== 'undefined' ? localStorage.getItem('mi_students_data') : null;
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        const clean = purgeMockStudents(parsed);
        if (clean.length > 0) {
          return clean;
        }
      } catch (e) {}
    }

    // 3. Cek secondary key di localStorage
    const savedLegacy = typeof window !== 'undefined' ? localStorage.getItem('mi_students_list') : null;
    if (savedLegacy !== null) {
      try {
        const parsed = JSON.parse(savedLegacy);
        const clean = purgeMockStudents(parsed);
        if (clean.length > 0) {
          return clean;
        }
      } catch (e) {}
    }

    // 4. Cek persistent backup vault
    const savedVault = typeof window !== 'undefined' ? localStorage.getItem('mi_students_backup_vault') : null;
    if (savedVault !== null) {
      try {
        const parsed = JSON.parse(savedVault);
        const clean = purgeMockStudents(parsed);
        if (clean.length > 0) {
          return clean;
        }
      } catch (e) {}
    }

    // 5. Fallback ke window.__PLESK_INITIAL_DATA__ HANYA jika browser belum memiliki data siswa
    if (typeof window !== 'undefined' && Array.isArray((window as any).__PLESK_INITIAL_DATA__?.students)) {
      const pleskData = (window as any).__PLESK_INITIAL_DATA__;
      const cleanPlesk = purgeMockStudents(pleskData.students);
      if (cleanPlesk.length > 0) {
        return cleanPlesk;
      }
    }

    return [];
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const keys = ['mi_students_data', 'mi_students_list', 'mi_students_backup_vault', 'mi_permanent_vault_students'];
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const list = parsed?.data || parsed;
            const clean = purgeMockStudents(list);
            if (clean.length > 0) {
              return clean[0].id;
            }
          } catch (e) {}
        }
      }
    }
    return '';
  });

  // Public Class Filter State
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  // Group students by Class for organized selection
  const groupedStudentsByClass = useMemo(() => {
    const groups: { [key: string]: Student[] } = {};
    students.forEach((student) => {
      const cls = student.kelas?.trim() || 'Tanpa Kelas';
      if (!groups[cls]) {
        groups[cls] = [];
      }
      groups[cls].push(student);
    });

    const sortedClassNames = Object.keys(groups).sort((a, b) => 
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );

    return sortedClassNames.map((className) => ({
      className,
      students: groups[className].sort((a, b) => a.nama.localeCompare(b.nama)),
    }));
  }, [students]);

  const distinctClasses = useMemo(() => {
    return groupedStudentsByClass.map((g) => g.className);
  }, [groupedStudentsByClass]);

  const displayedGroups = useMemo(() => {
    if (selectedClassFilter === 'ALL') {
      return groupedStudentsByClass;
    }
    return groupedStudentsByClass.filter((g) => g.className === selectedClassFilter);
  }, [groupedStudentsByClass, selectedClassFilter]);

  const handleClassFilterChange = (newClass: string) => {
    setSelectedClassFilter(newClass);
    if (newClass !== 'ALL') {
      const targetGroup = groupedStudentsByClass.find((g) => g.className === newClass);
      if (targetGroup && targetGroup.students.length > 0) {
        const isInClass = targetGroup.students.some((s) => s.id === selectedStudentId);
        if (!isInClass) {
          setSelectedStudentId(targetGroup.students[0].id);
        }
      }
    }
  };

  const [madrasah, setMadrasah] = useState<MadrasahInfo>(() => {
    // 1. Cek penyimpanan lokal yang sudah ada (Proteksi anti-timpa saat update ZIP)
    const saved = typeof window !== 'undefined' ? localStorage.getItem('mi_madrasah_info') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (!parsed.namaKepalaMadrasah) {
            parsed.namaKepalaMadrasah = INITIAL_MADRASAH.namaKepalaMadrasah;
            parsed.nipKepalaMadrasah = INITIAL_MADRASAH.nipKepalaMadrasah;
          }
          if (!parsed.judulHeaderAplikasi) {
            parsed.judulHeaderAplikasi = INITIAL_MADRASAH.judulHeaderAplikasi;
            parsed.subJudulHeaderAplikasi = parsed.namaMadrasah || INITIAL_MADRASAH.subJudulHeaderAplikasi;
            parsed.badgeHeaderAplikasi = INITIAL_MADRASAH.badgeHeaderAplikasi;
            parsed.showMadrasahInHeader = INITIAL_MADRASAH.showMadrasahInHeader;
          }
          return parsed;
        }
      } catch (e) { console.error(e); }
    }

    // 2. Fallback ke window.__PLESK_INITIAL_DATA__ HANYA jika browser belum memiliki profil tersimpan
    if (typeof window !== 'undefined' && (window as any).__PLESK_INITIAL_DATA__?.madrasah) {
      const pleskData = (window as any).__PLESK_INITIAL_DATA__;
      if (pleskData.madrasah && pleskData.madrasah.namaMadrasah) {
        return pleskData.madrasah;
      }
    }

    return INITIAL_MADRASAH;
  });

  const [cardConfig, setCardConfig] = useState<CardConfig>(() => {
    // 1. Prioritaskan konfigurasi kartu yang sudah tersimpan di browser
    const saved = typeof window !== 'undefined' ? localStorage.getItem('mi_card_config') : null;
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }

    // 2. Fallback ke window.__PLESK_INITIAL_DATA__ hanya saat instalasi bersih
    if (typeof window !== 'undefined' && (window as any).__PLESK_INITIAL_DATA__?.cardConfig) {
      const pleskData = (window as any).__PLESK_INITIAL_DATA__;
      if (pleskData.cardConfig) {
        return pleskData.cardConfig;
      }
    }

    return INITIAL_CARD_CONFIG;
  });

  // Admin User & Auth State
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('mi_admin_user');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isAuthenticated) {
          return parsed;
        }
      } catch (e) { console.error(e); }
    }
    // Default null (guest/public mode) -> requires login to access Admin Dashboard
    return null;
  });

  // Page Loader Config State (with localStorage persistence)
  const [loaderConfig, setLoaderConfig] = useState<PageLoaderConfig>(() => {
    // 1. Prioritaskan konfigurasi loader yang sudah tersimpan di browser
    const saved = typeof window !== 'undefined' ? localStorage.getItem('mi_loader_config') : null;
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }

    // 2. Fallback ke window.__PLESK_INITIAL_DATA__ jika belum ada konfigurasi
    if (typeof window !== 'undefined' && (window as any).__PLESK_INITIAL_DATA__?.loaderConfig) {
      const pleskData = (window as any).__PLESK_INITIAL_DATA__;
      if (pleskData.loaderConfig) {
        return pleskData.loaderConfig;
      }
    }

    return INITIAL_LOADER_CONFIG;
  });

  const [isEditLocked, setIsEditLocked] = useState<boolean>(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('mi_activity_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_LOGS;
  });

  // Central Database Sync State & Tracking
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'syncing' | 'error'>('synced');
  const syncStatusRef = useRef<'synced' | 'saving' | 'syncing' | 'error'>('synced');
  syncStatusRef.current = syncStatus;
  const [isLoadedFromBackend, setIsLoadedFromBackend] = useState<boolean>(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);
  const [lastServerUpdate, setLastServerUpdate] = useState<string>('');
  const isInitialHydratedRef = useRef<boolean>(false);
  const isSyncingFromRemoteRef = useRef<boolean>(false);
  const hasPendingUserEditsRef = useRef<boolean>(false);
  const lastKnownServerTimeRef = useRef<string>('');
  const lastLocalEditTimeRef = useRef<number>(0);
  const lastCardConfigEditTimeRef = useRef<number>(0);
  const isImportingOrSavingRef = useRef<boolean>(false);
  const isExplicitlyClearedRef = useRef<boolean>(false);
  const studentsRef = useRef<Student[]>(students);
  studentsRef.current = students;
  const madrasahRef = useRef<MadrasahInfo>(madrasah);
  madrasahRef.current = madrasah;
  const cardConfigRef = useRef<CardConfig>(cardConfig);
  cardConfigRef.current = cardConfig;

  const userEditTimerRef = useRef<NodeJS.Timeout | null>(null);
  const markUserEdited = () => {
    hasPendingUserEditsRef.current = true;
    lastLocalEditTimeRef.current = Date.now();
    if (userEditTimerRef.current) {
      clearTimeout(userEditTimerRef.current);
    }
    userEditTimerRef.current = setTimeout(() => {
      hasPendingUserEditsRef.current = false;
    }, 4000);
  };

  // UI Tabs & Modals
  const [activeTab, setActiveTab] = useState<'student' | 'madrasah' | 'design' | 'batch'>('student');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printTargetStudentIds, setPrintTargetStudentIds] = useState<string[] | undefined>(undefined);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [isPleskModalOpen, setIsPleskModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isActivityLogModalOpen, setIsActivityLogModalOpen] = useState<boolean>(false);
  const [isBackupRestoreModalOpen, setIsBackupRestoreModalOpen] = useState<boolean>(false);
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState<boolean>(false);
  const [isEmisExcelModalOpen, setIsEmisExcelModalOpen] = useState<boolean>(false);
  const [isSuratAktifModalOpen, setIsSuratAktifModalOpen] = useState<boolean>(false);
  const [isPageLoaderSettingsOpen, setIsPageLoaderSettingsOpen] = useState<boolean>(false);

  // Overlay processing state for async operations
  const [actionOverlay, setActionOverlay] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    progress?: number;
    iconType?: 'zip' | 'pdf' | 'save' | 'load';
  }>({
    isOpen: false,
    title: '',
  });

  // Fast Initial Loader on App Mount (Ultra snappy, never blocks access)
  useEffect(() => {
    if (!loaderConfig.enabled) {
      setIsInitialLoading(false);
      return;
    }

    const duration = Math.min(600, loaderConfig.loadingDurationMs || 300);
    setLoadingProgress(25);
    setLoadingStatus(loaderConfig.step1Text || 'Memulai Sistem Kartu Pelajar MI...');

    const timer1 = setTimeout(() => {
      setLoadingProgress(70);
      setLoadingStatus(loaderConfig.step2Text || 'Memverifikasi Data Siswa & CR80...');
    }, Math.max(50, duration * 0.3));

    const timer2 = setTimeout(() => {
      setLoadingProgress(100);
      setLoadingStatus(loaderConfig.step3Text || 'Sistem Siap Digunakan!');
    }, Math.max(100, duration * 0.7));

    const timer3 = setTimeout(() => {
      setIsInitialLoading(false);
    }, duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [loaderConfig.enabled, loaderConfig.loadingDurationMs, loaderConfig.step1Text, loaderConfig.step2Text, loaderConfig.step3Text]);

  // Authoritative server fetch and save using universal apiUtils
  const fetchCentralServerData = async () => {
    const res = await fetchServerCentralState();
    return res.success ? res.data : null;
  };

  const saveCentralServerData = async (payload: any) => {
    const enrichedPayload = {
      cardConfig: cardConfigRef.current,
      madrasah: madrasahRef.current,
      ...payload,
    };
    return await saveServerCentralState(enrichedPayload);
  };

  // Helpers to detect if data is default template or custom user data
  const isDefaultMadrasah = (m?: MadrasahInfo | null): boolean => {
    if (!m || !m.namaMadrasah) return true;
    return (
      m.namaMadrasah.trim().toUpperCase() === INITIAL_MADRASAH.namaMadrasah.trim().toUpperCase() &&
      m.nsm === INITIAL_MADRASAH.nsm &&
      m.npsn === INITIAL_MADRASAH.npsn
    );
  };

  const isDefaultStudents = (list?: Student[] | null): boolean => {
    if (!list || list.length === 0) return false;
    if (list.length === INITIAL_STUDENTS.length) {
      const listIds = list.map((s) => s.id).sort().join(',');
      const initialIds = INITIAL_STUDENTS.map((s) => s.id).sort().join(',');
      return listIds === initialIds;
    }
    return false;
  };

  // 1. Initial Mount: Fetch synchronized data from central server database with bulletproof server-first hydration
  useEffect(() => {
    let isMounted = true;
    const fetchServerData = async () => {
      try {
        setSyncStatus('syncing');

        // Check persistent indexedDB/localStorage for cached data as emergency offline fallback
        let [cachedMadrasah, cachedStudents, cachedConfig, cachedLoader, cachedLogs] = await Promise.all([
          getPersistentItem<MadrasahInfo>('mi_madrasah_info'),
          getPersistentItem<Student[]>('mi_students_data'),
          getPersistentItem<CardConfig>('mi_card_config'),
          getPersistentItem<PageLoaderConfig>('mi_loader_config'),
          getPersistentItem<ActivityLog[]>('mi_activity_logs'),
        ]);

        // If local cache lacks custom madrasah, also check permanent vault
        if (!cachedMadrasah || isDefaultMadrasah(cachedMadrasah)) {
          const vault = await restoreFromPermanentVault();
          if (vault?.madrasah && !isDefaultMadrasah(vault.madrasah)) {
            cachedMadrasah = vault.madrasah;
          }
        }

        // Attempt central server fetch (MySQL is the single source of truth!)
        const res = await fetchServerCentralState();

        if (res.success && res.data && isMounted) {
          const d = res.data;
          isSyncingFromRemoteRef.current = true;

          // 1. Hydrate Madrasah Profile from server (respect server's exact tahunPelajaran)
          if (d.madrasah && typeof d.madrasah === 'object' && d.madrasah.namaMadrasah) {
            let cleanMadrasah = { ...d.madrasah };
            
            // Auto-heal server if server has default template but client has custom madrasah
            if (isDefaultMadrasah(cleanMadrasah) && cachedMadrasah && !isDefaultMadrasah(cachedMadrasah)) {
              cleanMadrasah = { ...cachedMadrasah };
              saveCentralServerData({ madrasah: cachedMadrasah }).catch(() => {});
            }

            if (!cleanMadrasah.tahunPelajaran) {
              cleanMadrasah.tahunPelajaran = INITIAL_MADRASAH.tahunPelajaran;
            }
            if (!cleanMadrasah.judulHeaderAplikasi) {
              cleanMadrasah.judulHeaderAplikasi = INITIAL_MADRASAH.judulHeaderAplikasi;
              cleanMadrasah.subJudulHeaderAplikasi = cleanMadrasah.namaMadrasah || INITIAL_MADRASAH.subJudulHeaderAplikasi;
              cleanMadrasah.badgeHeaderAplikasi = INITIAL_MADRASAH.badgeHeaderAplikasi;
              cleanMadrasah.showMadrasahInHeader = INITIAL_MADRASAH.showMadrasahInHeader;
            } else if (cleanMadrasah.subJudulHeaderAplikasi === INITIAL_MADRASAH.subJudulHeaderAplikasi && cleanMadrasah.namaMadrasah && cleanMadrasah.namaMadrasah !== INITIAL_MADRASAH.namaMadrasah) {
              cleanMadrasah.subJudulHeaderAplikasi = cleanMadrasah.namaMadrasah;
            }
            setMadrasah(cleanMadrasah);
            try {
              localStorage.setItem('mi_madrasah_info', JSON.stringify(cleanMadrasah));
              localStorage.setItem('mi_madrasah_updated_at', Date.now().toString());
            } catch (e) {}
            setPersistentItem('mi_madrasah_info', cleanMadrasah).catch(() => {});
          } else if (cachedMadrasah && cachedMadrasah.namaMadrasah) {
            setMadrasah(cachedMadrasah);
            saveCentralServerData({ madrasah: cachedMadrasah }).catch(() => {});
          }

          // 2. Hydrate Students Data from server (whatever count MySQL has, ALL browsers receive the exact same count!)
          if (d.students !== undefined && Array.isArray(d.students)) {
            const cleanServerStudents = purgeMockStudents(d.students);
            if (cleanServerStudents.length > 0) {
              setStudents(cleanServerStudents);
              setSelectedStudentId((prevId) => cleanServerStudents.some((s: Student) => s.id === prevId) ? prevId : (cleanServerStudents[0]?.id || ''));
              try {
                localStorage.setItem('mi_students_data', JSON.stringify(cleanServerStudents));
                localStorage.setItem('mi_students_list', JSON.stringify(cleanServerStudents));
              } catch (e) {}
              setPersistentItem('mi_students_data', cleanServerStudents).catch(() => {});
            } else if (cachedStudents && Array.isArray(cachedStudents) && cachedStudents.length > 0) {
              // Server returned 0, but local cache/vault has students! Auto-heal server so data is never lost!
              const cleanCached = purgeMockStudents(cachedStudents);
              setStudents(cleanCached);
              setSelectedStudentId((prev) => (cleanCached.some((s) => s.id === prev) ? prev : cleanCached[0]?.id || ''));
              saveCentralServerData({ students: cleanCached }).catch(() => {});
            } else {
              setStudents([]);
              setSelectedStudentId('');
            }
          } else if (cachedStudents && Array.isArray(cachedStudents)) {
            const cleanCached = purgeMockStudents(cachedStudents);
            setStudents(cleanCached);
            if (cleanCached.length > 0) {
              setSelectedStudentId((prev) => (cleanCached.some((s) => s.id === prev) ? prev : cleanCached[0].id));
              saveCentralServerData({ students: cleanCached }).catch(() => {});
            } else {
              setSelectedStudentId('');
            }
          }

          // 3. Hydrate Card Design Config from server
          const serverTimestamp = d.lastUpdated ? new Date(d.lastUpdated).getTime() : 0;
          const cachedTimeStr = typeof window !== 'undefined' ? localStorage.getItem('mi_card_config_updated_at') : null;
          const cachedTime = cachedTimeStr ? parseInt(cachedTimeStr, 10) : 0;

          if (cachedConfig && cachedTime > serverTimestamp) {
            // Local client edits are newer than server: preserve local cardConfig and sync to server!
            setCardConfig(cachedConfig);
            cardConfigRef.current = cachedConfig;
            lastCardConfigEditTimeRef.current = cachedTime;
            saveCentralServerData({ cardConfig: cachedConfig }).catch(() => {});
          } else if (d.cardConfig && typeof d.cardConfig === 'object') {
            const cleanConfig: CardConfig = {
              ...INITIAL_CARD_CONFIG,
              ...(cachedConfig || {}),
              ...d.cardConfig,
            };
            if (d.cardConfig.showKemenagLogo === false || d.cardConfig.logoMode === 'right_only' || d.cardConfig.logoMode === 'none' || d.cardConfig.logoMode === 'madrasah_only') {
              cleanConfig.showKemenagLogo = false;
            }
            if (d.cardConfig.showMadrasahLogo === false || d.cardConfig.logoMode === 'left_only' || d.cardConfig.logoMode === 'none' || d.cardConfig.logoMode === 'kemenag_only') {
              cleanConfig.showMadrasahLogo = false;
            }
            if (d.cardConfig.showStamp === false) {
              cleanConfig.showStamp = false;
            }
            if (d.cardConfig.showSignature === false) {
              cleanConfig.showSignature = false;
            }
            setCardConfig(cleanConfig);
            cardConfigRef.current = cleanConfig;
            try {
              localStorage.setItem('mi_card_config', JSON.stringify(cleanConfig));
            } catch (e) {}
            setPersistentItem('mi_card_config', cleanConfig).catch(() => {});
          } else if (cachedConfig) {
            setCardConfig(cachedConfig);
            cardConfigRef.current = cachedConfig;
          }

          // 4. Hydrate Loader Config & Logs
          if (d.loaderConfig) {
            setLoaderConfig(d.loaderConfig);
            setPersistentItem('mi_loader_config', d.loaderConfig).catch(() => {});
          } else if (cachedLoader) {
            setLoaderConfig(cachedLoader);
          }

          if (d.activityLogs && Array.isArray(d.activityLogs)) {
            setActivityLogs(d.activityLogs);
            setPersistentItem('mi_activity_logs', d.activityLogs).catch(() => {});
          } else if (cachedLogs && Array.isArray(cachedLogs)) {
            setActivityLogs(cachedLogs);
          }

          const serverTime = d.lastUpdated || new Date().toISOString();
          setLastServerUpdate(serverTime);
          lastKnownServerTimeRef.current = serverTime;

          hasPendingUserEditsRef.current = false;
          setSyncStatus('synced');
          setIsLoadedFromBackend(true);
          isInitialHydratedRef.current = true;
          setIsInitialLoading(false);
          setTimeout(() => {
            isSyncingFromRemoteRef.current = false;
          }, 300);
          return;
        }

        // If server is not reachable (offline mode), fallback to local cache
        if (isMounted) {
          if (cachedMadrasah && cachedMadrasah.namaMadrasah) {
            setMadrasah(cachedMadrasah);
          }
          if (cachedStudents && Array.isArray(cachedStudents)) {
            setStudents(cachedStudents);
            if (cachedStudents.length > 0) {
              setSelectedStudentId((prev) => (cachedStudents.some((s) => s.id === prev) ? prev : cachedStudents[0].id));
            }
          }
          if (cachedConfig) setCardConfig(cachedConfig);
          if (cachedLoader) setLoaderConfig(cachedLoader);

          hasPendingUserEditsRef.current = false;
          setSyncStatus('synced');
          setIsLoadedFromBackend(true);
          isInitialHydratedRef.current = true;
          setIsInitialLoading(false);
          isSyncingFromRemoteRef.current = false;
        }
      } catch (err) {
        console.warn('Sync notice (using local fallback):', err);
        if (isMounted) {
          hasPendingUserEditsRef.current = false;
          setSyncStatus('synced');
          setIsLoadedFromBackend(true);
          isInitialHydratedRef.current = true;
          setIsInitialLoading(false);
          isSyncingFromRemoteRef.current = false;
        }
      }
    };

    fetchServerData();
    return () => { isMounted = false; };
  }, []);

  // 2. LocalStorage & IndexedDB Cache Persistence with Multi-Layer Vault
  useEffect(() => {
    if (!isInitialHydratedRef.current) return;
    try {
      localStorage.setItem('mi_loader_config', JSON.stringify(loaderConfig));
      setPersistentItem('mi_loader_config', loaderConfig).catch(() => {});
      saveToPermanentVault(undefined, undefined, undefined, loaderConfig).catch(() => {});
    } catch (e) {}
  }, [loaderConfig]);

  useEffect(() => {
    if (!isInitialHydratedRef.current) return;
    try {
      const ts = Date.now().toString();
      localStorage.setItem('mi_students_data', JSON.stringify(students));
      localStorage.setItem('mi_students_list', JSON.stringify(students));
      localStorage.setItem('mi_students_updated_at', ts);
      localStorage.setItem('mi_students_data_updated_at', ts);
      if (students.length > 0) {
        localStorage.setItem('mi_students_backup_vault', JSON.stringify(students));
      }
      setPersistentItem('mi_students_data', students).catch(() => {});
      saveToPermanentVault(undefined, students, undefined, undefined).catch(() => {});
    } catch (e) {}
  }, [students]);

  useEffect(() => {
    if (!isInitialHydratedRef.current) return;
    try {
      const ts = Date.now().toString();
      localStorage.setItem('mi_madrasah_info', JSON.stringify(madrasah));
      localStorage.setItem('mi_madrasah_updated_at', ts);
      localStorage.setItem('mi_madrasah_info_updated_at', ts);
      if (madrasah?.namaMadrasah) {
        localStorage.setItem('mi_madrasah_backup_vault', JSON.stringify(madrasah));
      }
      setPersistentItem('mi_madrasah_info', madrasah).catch(() => {});
      saveToPermanentVault(madrasah, undefined, undefined, undefined).catch(() => {});
    } catch (e) {}
  }, [madrasah]);

  // Synchronize browser tab document title with school name
  useEffect(() => {
    if (madrasah?.namaMadrasah) {
      document.title = `Generator Kartu Pelajar - ${madrasah.namaMadrasah}`;
    }
  }, [madrasah?.namaMadrasah]);

  useEffect(() => {
    if (!isInitialHydratedRef.current) return;
    try {
      const ts = Date.now().toString();
      localStorage.setItem('mi_card_config', JSON.stringify(cardConfig));
      localStorage.setItem('mi_card_config_updated_at', ts);
      setPersistentItem('mi_card_config', cardConfig).catch(() => {});
      saveToPermanentVault(undefined, undefined, cardConfig, undefined).catch(() => {});
    } catch (e) {}
  }, [cardConfig]);

  useEffect(() => {
    if (!isInitialHydratedRef.current) return;
    try {
      localStorage.setItem('mi_activity_logs', JSON.stringify(activityLogs));
      setPersistentItem('mi_activity_logs', activityLogs).catch(() => {});
    } catch (e) {}
  }, [activityLogs]);

  // 3. Before Unload & Beacon API - Only sends when there are actual pending user edits
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        if (!isInitialHydratedRef.current || !hasPendingUserEditsRef.current) return;
        const payload = JSON.stringify({
          madrasah,
          students,
          cardConfig,
          loaderConfig,
        });
        localStorage.setItem('mi_madrasah_info', JSON.stringify(madrasah));
        localStorage.setItem('mi_students_data', JSON.stringify(students));
        localStorage.setItem('mi_card_config', JSON.stringify(cardConfig));
        localStorage.setItem('mi_loader_config', JSON.stringify(loaderConfig));
        localStorage.setItem('mi_madrasah_updated_at', Date.now().toString());
        localStorage.setItem('mi_students_updated_at', Date.now().toString());
        localStorage.setItem('mi_card_config_updated_at', Date.now().toString());
        localStorage.setItem('mi_data_has_user_edits', 'true');

        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/data', blob);
        }
      } catch (e) {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [madrasah, students, cardConfig, loaderConfig]);

  // 4. Central Database Server Auto-Save (ONLY fires when user has modified state)
  useEffect(() => {
    if (!isInitialHydratedRef.current || !isLoadedFromBackend || isSyncingFromRemoteRef.current || !hasPendingUserEditsRef.current) return;

    setSyncStatus('saving');
    const timer = setTimeout(async () => {
      try {
        const payload = {
          madrasah: madrasahRef.current,
          students: studentsRef.current,
          cardConfig: cardConfigRef.current,
          loaderConfig,
          activityLogs,
        };

        // Instant local cross-tab broadcast
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('mi_realtime_channel');
            bc.postMessage({ type: 'local_sync', payload, timestamp: Date.now() });
            bc.close();
          }
        } catch (e) {}

        const json = await saveCentralServerData(payload);
        if (json) {
          if (json.lastUpdated) {
            setLastServerUpdate(json.lastUpdated);
            lastKnownServerTimeRef.current = json.lastUpdated;
            const resTime = new Date(json.lastUpdated).getTime();
            if (resTime > lastCardConfigEditTimeRef.current) {
              lastCardConfigEditTimeRef.current = resTime;
            }
          }
          hasPendingUserEditsRef.current = false;
          setSyncStatus('synced');
        } else {
          setSyncStatus('synced');
        }
      } catch (err) {
        setSyncStatus('synced');
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [madrasah, students, cardConfig, loaderConfig, activityLogs, isLoadedFromBackend]);

  // 5. Real-Time Server-Sent Events (SSE) Stream + Ultra-Snappy 1.2s Heartbeat Polling
  // Guarantees zero-delay instant synchronization between WiFi and Mobile Data clients
  useEffect(() => {
    if (!isLoadedFromBackend) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;
    let isCleanedUp = false;

    // Cross-tab broadcast listener for instant zero-ms sync between tabs/windows
    let localBc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        localBc = new BroadcastChannel('mi_realtime_channel');
        localBc.onmessage = (event) => {
          if (isCleanedUp || !event.data || event.data.type !== 'local_sync') return;
          const { payload } = event.data;
          if (payload && syncStatusRef.current !== 'saving') {
            isSyncingFromRemoteRef.current = true;
            if (payload.madrasah) {
              setMadrasah(payload.madrasah);
              try {
                localStorage.setItem('mi_madrasah_info', JSON.stringify(payload.madrasah));
                localStorage.setItem('mi_madrasah_updated_at', Date.now().toString());
              } catch (e) {}
              setPersistentItem('mi_madrasah_info', payload.madrasah).catch(() => {});
            }
            if (payload.students) {
              setStudents(payload.students);
              setPersistentItem('mi_students_data', payload.students).catch(() => {});
            }
            if (payload.cardConfig) {
              setCardConfig(payload.cardConfig);
              setPersistentItem('mi_card_config', payload.cardConfig).catch(() => {});
            }
            if (payload.loaderConfig) {
              setLoaderConfig(payload.loaderConfig);
              setPersistentItem('mi_loader_config', payload.loaderConfig).catch(() => {});
            }
            setTimeout(() => {
              isSyncingFromRemoteRef.current = false;
            }, 100);
          }
        };
      }
    } catch (e) {}

    let sseRetryCount = 0;
    const connectSSE = () => {
      try {
        if (typeof EventSource === 'undefined') return;
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        const sseUrl = getLiveStreamEndpoint();
        eventSource = new EventSource(sseUrl);

        eventSource.onopen = () => {
          if (isCleanedUp) return;
          sseRetryCount = 0;
          setIsRealtimeConnected(true);
        };

        eventSource.onmessage = (event) => {
          if (isCleanedUp || !event.data) return;
          try {
            const raw = JSON.parse(event.data);
            if (!raw) return;
            const payload = (raw.data && raw.type === 'DATA_UPDATE') ? raw.data : raw;
            const payloadType = raw.type || payload.type;
            if (!payloadType) return;

            // Only skip remote update if this client is actively performing a heavy save/import
            // or if the user edited something locally in the last 3000ms or has pending local edits
            if ((syncStatusRef.current === 'saving' && isImportingOrSavingRef.current) || (Date.now() - lastLocalEditTimeRef.current < 3000) || hasPendingUserEditsRef.current) {
              return;
            }

            const incomingTime = payload.lastUpdated || raw.lastUpdated;
            if (incomingTime && incomingTime !== lastKnownServerTimeRef.current) {
              isSyncingFromRemoteRef.current = true;
              if (payload.madrasah && typeof payload.madrasah === 'object' && payload.madrasah.namaMadrasah) {
                const cleanMad = { ...payload.madrasah };
                if (cleanMad.subJudulHeaderAplikasi === INITIAL_MADRASAH.subJudulHeaderAplikasi && cleanMad.namaMadrasah && cleanMad.namaMadrasah !== INITIAL_MADRASAH.namaMadrasah) {
                  cleanMad.subJudulHeaderAplikasi = cleanMad.namaMadrasah;
                }
                setMadrasah(cleanMad);
                try {
                  localStorage.setItem('mi_madrasah_info', JSON.stringify(cleanMad));
                  localStorage.setItem('mi_madrasah_updated_at', Date.now().toString());
                } catch (e) {}
                setPersistentItem('mi_madrasah_info', cleanMad).catch(() => {});
              }
              if (payload.students !== undefined && Array.isArray(payload.students)) {
                const cleanPayloadStudents = purgeMockStudents(payload.students);
                if (cleanPayloadStudents.length === 0 && studentsRef.current.length > 0 && !isExplicitlyClearedRef.current && !payload.isExplicitClear) {
                  console.warn('SSE payload has 0 students while client has students. Auto-healing server...');
                  saveCentralServerData({ students: studentsRef.current }).catch(() => {});
                } else {
                  setStudents(cleanPayloadStudents);
                  setSelectedStudentId((prevId) => cleanPayloadStudents.some((s: Student) => s.id === prevId) ? prevId : (cleanPayloadStudents[0]?.id || ''));
                  try {
                    localStorage.setItem('mi_students_data', JSON.stringify(cleanPayloadStudents));
                  } catch (e) {}
                  setPersistentItem('mi_students_data', cleanPayloadStudents).catch(() => {});
                  saveToPermanentVault(undefined, cleanPayloadStudents, undefined, undefined).catch(() => {});
                }
              }
              if (payload.cardConfig) {
                const incomingTimestamp = payload.lastUpdated ? new Date(payload.lastUpdated).getTime() : (incomingTime ? new Date(incomingTime).getTime() : 0);
                if (incomingTimestamp > lastCardConfigEditTimeRef.current) {
                  const mergedConfig: CardConfig = {
                    ...INITIAL_CARD_CONFIG,
                    ...cardConfigRef.current,
                    ...payload.cardConfig,
                  };
                  setCardConfig(mergedConfig);
                  cardConfigRef.current = mergedConfig;
                  try {
                    localStorage.setItem('mi_card_config', JSON.stringify(mergedConfig));
                    localStorage.setItem('mi_card_config_updated_at', incomingTimestamp.toString());
                  } catch (e) {}
                  setPersistentItem('mi_card_config', mergedConfig).catch(() => {});
                }
              }
              if (payload.loaderConfig) {
                setLoaderConfig(payload.loaderConfig);
                try {
                  localStorage.setItem('mi_loader_config', JSON.stringify(payload.loaderConfig));
                } catch (e) {}
                setPersistentItem('mi_loader_config', payload.loaderConfig).catch(() => {});
              }
              if (payload.activityLogs && Array.isArray(payload.activityLogs)) {
                setActivityLogs(payload.activityLogs);
                setPersistentItem('mi_activity_logs', payload.activityLogs).catch(() => {});
              }

              lastKnownServerTimeRef.current = incomingTime;
              setLastServerUpdate(incomingTime);
              hasPendingUserEditsRef.current = false;
              setSyncStatus('synced');
              setTimeout(() => {
                isSyncingFromRemoteRef.current = false;
              }, 200);
            }
          } catch (e) {
            // ignore non-json messages (like heartbeats)
          }
        };

        eventSource.onerror = () => {
          if (isCleanedUp) return;
          setIsRealtimeConnected(false);
          sseRetryCount++;
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Reconnect with backoff, resilient across network switches and proxy drops
          const delay = Math.min(2000 + (sseRetryCount * 1000), 7000);
          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(connectSSE, delay);
        };
      } catch (err) {
        setIsRealtimeConnected(false);
      }
    };

    connectSSE();

    // Fast Version/Timestamp Poller detects any changes on other browsers/devices
    const pollFastVersion = async () => {
      if (syncStatusRef.current === 'saving' && isImportingOrSavingRef.current) {
        return;
      }

      try {
        const v = await fetchServerVersion();
        if (!v) return;

        const isTimeDiff = v.lastUpdated && v.lastUpdated !== lastKnownServerTimeRef.current;
        const isCountDiff = v.totalStudents !== undefined && v.totalStudents !== studentsRef.current.length;
        const isYearDiff = v.tahunPelajaran && v.tahunPelajaran !== madrasahRef.current.tahunPelajaran;
        const isNameDiff = v.madrasahName && v.madrasahName !== madrasahRef.current.namaMadrasah;

        if (isTimeDiff || isCountDiff || isYearDiff || isNameDiff) {
          // If the user was actively modifying state locally within the last 3s or has pending edits, wait for pause
          if (Date.now() - lastLocalEditTimeRef.current < 3000 || hasPendingUserEditsRef.current) {
            return;
          }

          // Change detected on server, fetch authoritative full state immediately!
          const res = await fetchServerCentralState();
          if (res.success && res.data) {
            const d = res.data;
            isSyncingFromRemoteRef.current = true;
            if (d.madrasah && typeof d.madrasah === 'object' && d.madrasah.namaMadrasah) {
              const cleanMad = { ...d.madrasah };
              if (cleanMad.subJudulHeaderAplikasi === INITIAL_MADRASAH.subJudulHeaderAplikasi && cleanMad.namaMadrasah && cleanMad.namaMadrasah !== INITIAL_MADRASAH.namaMadrasah) {
                cleanMad.subJudulHeaderAplikasi = cleanMad.namaMadrasah;
              }
              setMadrasah(cleanMad);
              try {
                localStorage.setItem('mi_madrasah_info', JSON.stringify(cleanMad));
                localStorage.setItem('mi_madrasah_updated_at', Date.now().toString());
              } catch (e) {}
              setPersistentItem('mi_madrasah_info', cleanMad).catch(() => {});
            }
            if (d.students !== undefined && Array.isArray(d.students)) {
              const cleanPollerStudents = purgeMockStudents(d.students);
              if (cleanPollerStudents.length === 0 && studentsRef.current.length > 0 && !isExplicitlyClearedRef.current) {
                console.warn('Poller received 0 students while client has data. Auto-healing server...');
                saveCentralServerData({ students: studentsRef.current }).catch(() => {});
              } else {
                setStudents(cleanPollerStudents);
                setSelectedStudentId((prevId) => cleanPollerStudents.some((s: Student) => s.id === prevId) ? prevId : (cleanPollerStudents[0]?.id || ''));
                try {
                  localStorage.setItem('mi_students_data', JSON.stringify(cleanPollerStudents));
                } catch (e) {}
                setPersistentItem('mi_students_data', cleanPollerStudents).catch(() => {});
              }
            }
            if (d.cardConfig) {
              const incomingTimestamp = (d.lastUpdated || v.lastUpdated) ? new Date(d.lastUpdated || v.lastUpdated).getTime() : 0;
              if (incomingTimestamp > lastCardConfigEditTimeRef.current) {
                const mergedConfig: CardConfig = {
                  ...INITIAL_CARD_CONFIG,
                  ...cardConfigRef.current,
                  ...d.cardConfig,
                };
                if (d.cardConfig.showKemenagLogo === false || d.cardConfig.logoMode === 'right_only' || d.cardConfig.logoMode === 'none' || d.cardConfig.logoMode === 'madrasah_only') {
                  mergedConfig.showKemenagLogo = false;
                }
                if (d.cardConfig.showMadrasahLogo === false || d.cardConfig.logoMode === 'left_only' || d.cardConfig.logoMode === 'none' || d.cardConfig.logoMode === 'kemenag_only') {
                  mergedConfig.showMadrasahLogo = false;
                }
                if (d.cardConfig.showStamp === false) {
                  mergedConfig.showStamp = false;
                }
                if (d.cardConfig.showSignature === false) {
                  mergedConfig.showSignature = false;
                }
                setCardConfig(mergedConfig);
                cardConfigRef.current = mergedConfig;
                try {
                  localStorage.setItem('mi_card_config', JSON.stringify(mergedConfig));
                  localStorage.setItem('mi_card_config_updated_at', incomingTimestamp.toString());
                } catch (e) {}
                setPersistentItem('mi_card_config', mergedConfig).catch(() => {});
              }
            }
            if (d.loaderConfig) {
              setLoaderConfig(d.loaderConfig);
              try {
                localStorage.setItem('mi_loader_config', JSON.stringify(d.loaderConfig));
              } catch (e) {}
              setPersistentItem('mi_loader_config', d.loaderConfig).catch(() => {});
            }
            if (d.activityLogs && Array.isArray(d.activityLogs)) {
              setActivityLogs(d.activityLogs);
              setPersistentItem('mi_activity_logs', d.activityLogs).catch(() => {});
            }
            const newTime = d.lastUpdated || v.lastUpdated || new Date().toISOString();
            lastKnownServerTimeRef.current = newTime;
            setLastServerUpdate(newTime);
            hasPendingUserEditsRef.current = false;
            setSyncStatus('synced');
            setTimeout(() => {
              isSyncingFromRemoteRef.current = false;
            }, 200);
          }
        }
      } catch (e) {
        // silent fail on network fluctuation
      }
    };

    const versionInterval = setInterval(pollFastVersion, 2500);

    let lastInteractionTime = 0;
    const handleImmediateSync = (e?: Event) => {
      // Do not trigger immediate poller when interacting with buttons, inputs, toggles
      if (e && e.target && (e.target as HTMLElement).closest && (e.target as HTMLElement).closest('button, input, select, textarea, [role="button"]')) {
        return;
      }
      const now = Date.now();
      if (now - lastInteractionTime > 1000) {
        lastInteractionTime = now;
        pollFastVersion();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleImmediateSync();
      }
    };

    window.addEventListener('focus', handleImmediateSync);
    window.addEventListener('online', handleImmediateSync);
    window.addEventListener('pointerdown', handleImmediateSync);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isCleanedUp = true;
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (localBc) localBc.close();
      clearInterval(versionInterval);
      window.removeEventListener('focus', handleImmediateSync);
      window.removeEventListener('online', handleImmediateSync);
      window.removeEventListener('pointerdown', handleImmediateSync);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isLoadedFromBackend]);

  // Instant Force Refresh helper (Pulls latest data directly from central database with anti-loss protection)
  const handleForceRefresh = async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetchServerCentralState();
      if (res.success && res.data) {
        const d = res.data;
        isSyncingFromRemoteRef.current = true;
        if (d.madrasah) {
          setMadrasah(d.madrasah);
          setPersistentItem('mi_madrasah_info', d.madrasah).catch(() => {});
        }
        if (d.students !== undefined && Array.isArray(d.students)) {
          const clean = purgeMockStudents(d.students);
          if (clean.length === 0 && studentsRef.current.length > 0 && !isExplicitlyClearedRef.current) {
            console.warn('Server reported 0 students during refresh. Restoring from client memory...');
            saveCentralServerData({ students: studentsRef.current }).catch(() => {});
          } else {
            setStudents(clean);
            setSelectedStudentId((prevId) => clean.some((s: Student) => s.id === prevId) ? prevId : (clean[0]?.id || ''));
            setPersistentItem('mi_students_data', clean).catch(() => {});
            try {
              localStorage.setItem('mi_students_data', JSON.stringify(clean));
            } catch (e) {}
          }
        }
        if (d.cardConfig) {
          const incomingTimestamp = d.lastUpdated ? new Date(d.lastUpdated).getTime() : 0;
          if (incomingTimestamp > lastCardConfigEditTimeRef.current) {
            setCardConfig(d.cardConfig);
            cardConfigRef.current = d.cardConfig;
            try {
              localStorage.setItem('mi_card_config', JSON.stringify(d.cardConfig));
              localStorage.setItem('mi_card_config_updated_at', incomingTimestamp.toString());
            } catch (e) {}
            setPersistentItem('mi_card_config', d.cardConfig).catch(() => {});
          }
        }
        if (d.loaderConfig) {
          setLoaderConfig(d.loaderConfig);
          setPersistentItem('mi_loader_config', d.loaderConfig).catch(() => {});
        }
        if (d.activityLogs) {
          setActivityLogs(d.activityLogs);
          setPersistentItem('mi_activity_logs', d.activityLogs).catch(() => {});
        }
        const newTime = d.lastUpdated || new Date().toISOString();
        setLastServerUpdate(newTime);
        lastKnownServerTimeRef.current = newTime;
        setSyncStatus('synced');
        setTimeout(() => {
          isSyncingFromRemoteRef.current = false;
        }, 300);
        addLog('Refresh Data Realtime', `Berhasil memuat ${d.students?.length || 0} siswa & TP ${d.madrasah?.tahunPelajaran || ''} dari database server`, 'backup');
      } else {
        setSyncStatus('synced');
      }
    } catch (e) {
      setSyncStatus('error');
    }
  };

  // Manual Sync trigger
  const handleManualSync = async () => {
    setSyncStatus('saving');
    try {
      const json = await saveCentralServerData({
        madrasah: madrasahRef.current,
        students: studentsRef.current,
        cardConfig: cardConfigRef.current,
        loaderConfig,
        activityLogs,
      });
      if (json) {
        if (json.lastUpdated) {
          setLastServerUpdate(json.lastUpdated);
          lastKnownServerTimeRef.current = json.lastUpdated;
          const resTime = new Date(json.lastUpdated).getTime();
          if (resTime > lastCardConfigEditTimeRef.current) {
            lastCardConfigEditTimeRef.current = resTime;
          }
        }
        setSyncStatus('synced');
        addLog('Sinkronisasi Database Manual', `Seluruh data (${students.length} siswa) disinkronkan ke database server`, 'backup');
      } else {
        setSyncStatus('synced');
      }
    } catch (e) {
      setSyncStatus('error');
    }
  };

  // Log an activity helper
  const addLog = (
    action: string,
    details: string,
    type: ActivityLog['type'] = 'edit'
  ) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      action,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      operator: currentUser?.name || 'Operator',
      details,
      type,
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 49)]); // keep latest 50
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0] || DEFAULT_EMPTY_STUDENT;

  const handleUpdateStudents = async (newStudents: Student[]) => {
    markUserEdited();
    isExplicitlyClearedRef.current = newStudents.length === 0;
    setStudents(newStudents);
    if (newStudents.length > 0) {
      setSelectedStudentId((prev) => (newStudents.some((s) => s.id === prev) ? prev : newStudents[0].id));
    } else {
      setSelectedStudentId('');
    }
    try {
      localStorage.setItem('mi_students_data', JSON.stringify(newStudents));
      localStorage.setItem('mi_students_list', JSON.stringify(newStudents));
      localStorage.setItem('mi_students_updated_at', Date.now().toString());
    } catch (e) {}

    // Direct immediate sync to backend endpoints
    if (newStudents.length === 0) {
      setSyncStatus('saving');
      const clearEndpoints = [
        '/api/students/clear',
        '/api/clear_students.php',
        'api/clear_students.php',
        '/api/data.php?action=clear_students',
        'api/data.php?action=clear_students',
        '/api/data',
        '/api/data.php'
      ];
      for (const ep of clearEndpoints) {
        fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ students: [], action: 'clear_students' }),
        }).catch(() => {});
      }
      setTimeout(() => {
        hasPendingUserEditsRef.current = false;
        setSyncStatus('synced');
      }, 500);
    } else {
      setSyncStatus('saving');
      try {
        const res = await saveCentralServerData({ students: newStudents });
        if (res && res.lastUpdated) {
          setLastServerUpdate(res.lastUpdated);
          lastKnownServerTimeRef.current = res.lastUpdated;
        }
      } catch (e) {}
      hasPendingUserEditsRef.current = false;
      setSyncStatus('synced');
    }
    addLog('Update Siswa dari Dashboard', `Memperbarui daftar siswa (${newStudents.length} siswa)`, 'edit');
  };

  const handleUpdateCurrentStudent = (updated: Student) => {
    markUserEdited();
    try {
      localStorage.setItem('mi_students_updated_at', Date.now().toString());
    } catch (e) {}
    setStudents((prev) => {
      const updatedList = prev.map((s) => (s.id === updated.id ? updated : s));
      try {
        localStorage.setItem('mi_students_data', JSON.stringify(updatedList));
        localStorage.setItem('mi_students_list', JSON.stringify(updatedList));
      } catch (e) {}
      setPersistentItem('mi_students_data', updatedList).catch(() => {});
      saveCentralServerData({ students: updatedList }).catch(() => {});
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('mi_realtime_channel');
          bc.postMessage({ type: 'local_sync', payload: { students: updatedList }, timestamp: Date.now() });
          bc.close();
        }
      } catch (e) {}
      return updatedList;
    });
    addLog('Update Data Siswa', `Mengubah data siswa ${updated.nama} (NISN: ${updated.nisn})`, 'edit');
  };

  const handleUpdateMadrasah = (updated: MadrasahInfo) => {
    markUserEdited();
    try {
      const ts = Date.now().toString();
      localStorage.setItem('mi_madrasah_updated_at', ts);
      localStorage.setItem('mi_madrasah_info_updated_at', ts);
      localStorage.setItem('mi_madrasah_info', JSON.stringify(updated));
      localStorage.setItem('mi_data_has_user_edits', 'true');
    } catch (e) {}
    setMadrasah(updated);
    setSyncStatus('saving');
    
    // 1. Immediately write to persistent IndexedDB storage
    setPersistentItem('mi_madrasah_info', updated).catch(() => {});

    // 2. Broadcast immediately via BroadcastChannel
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('mi_realtime_channel');
        bc.postMessage({ type: 'local_sync', payload: { madrasah: updated }, timestamp: Date.now() });
        bc.close();
      }
    } catch (e) {}

    // 3. Immediately sync to central server database
    saveCentralServerData({ madrasah: updated })
      .then((res) => {
        if (res && res.lastUpdated) {
          setLastServerUpdate(res.lastUpdated);
          lastKnownServerTimeRef.current = res.lastUpdated;
        }
        hasPendingUserEditsRef.current = false;
        setSyncStatus('synced');
      })
      .catch(() => {
        hasPendingUserEditsRef.current = false;
        setSyncStatus('synced');
      });
  };

  const handleExplicitSaveMadrasah = async (updated: MadrasahInfo, updatedConfig?: CardConfig) => {
    const finalConfig = updatedConfig || cardConfigRef.current;
    markUserEdited();
    const editTime = Date.now();
    lastCardConfigEditTimeRef.current = editTime;
    cardConfigRef.current = finalConfig;
    
    try {
      localStorage.setItem('mi_madrasah_updated_at', editTime.toString());
      localStorage.setItem('mi_madrasah_info', JSON.stringify(updated));
      if (finalConfig) {
        localStorage.setItem('mi_card_config_updated_at', editTime.toString());
        localStorage.setItem('mi_card_config', JSON.stringify(finalConfig));
      }
    } catch (e) {}
    setMadrasah(updated);
    if (finalConfig) {
      setCardConfig(finalConfig);
    }
    setSyncStatus('saving');
    
    // 1. Immediately write to persistent IndexedDB storage & LocalStorage
    await setPersistentItem('mi_madrasah_info', updated);
    if (finalConfig) {
      await setPersistentItem('mi_card_config', finalConfig);
    }

    // 2. Broadcast immediately via BroadcastChannel
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('mi_realtime_channel');
        bc.postMessage({ type: 'local_sync', payload: { madrasah: updated, cardConfig: finalConfig }, timestamp: editTime });
        bc.close();
      }
    } catch (e) {}

    // 3. Direct immediate sync to central server
    try {
      const res = await saveCentralServerData({
        madrasah: updated,
        students: studentsRef.current,
        cardConfig: finalConfig,
        loaderConfig,
        activityLogs,
      });

      if (res && res.lastUpdated) {
        setLastServerUpdate(res.lastUpdated);
        lastKnownServerTimeRef.current = res.lastUpdated;
        const resTime = new Date(res.lastUpdated).getTime();
        if (resTime > lastCardConfigEditTimeRef.current) {
          lastCardConfigEditTimeRef.current = resTime;
        }
      }
      hasPendingUserEditsRef.current = false;
      setSyncStatus('synced');
    } catch (e) {
      hasPendingUserEditsRef.current = false;
      setSyncStatus('synced');
    }
    addLog('Simpan Profil Madrasah & Kop', `Profil ${updated.namaMadrasah} (NSM: ${updated.nsm}) berhasil disimpan dan disinkronkan ke server`, 'edit');
  };

  const handleSaveSignature = async (updated: MadrasahInfo) => {
    markUserEdited();
    try {
      localStorage.setItem('mi_madrasah_updated_at', Date.now().toString());
      localStorage.setItem('mi_madrasah_info', JSON.stringify(updated));
    } catch (e) {}
    setMadrasah(updated);
    setSyncStatus('saving');
    
    // 1. Immediately write to persistent IndexedDB storage & LocalStorage
    await setPersistentItem('mi_madrasah_info', updated);

    // 2. Broadcast immediately via BroadcastChannel
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('mi_realtime_channel');
        bc.postMessage({ type: 'local_sync', payload: { madrasah: updated }, timestamp: Date.now() });
        bc.close();
      }
    } catch (e) {}

    // 3. Direct sync to central server
    try {
      const res = await saveCentralServerData({
        madrasah: updated,
        students: studentsRef.current,
        cardConfig: cardConfigRef.current,
        loaderConfig,
        activityLogs,
      });

      if (res && res.lastUpdated) {
        setLastServerUpdate(res.lastUpdated);
        lastKnownServerTimeRef.current = res.lastUpdated;
        const resTime = new Date(res.lastUpdated).getTime();
        if (resTime > lastCardConfigEditTimeRef.current) {
          lastCardConfigEditTimeRef.current = resTime;
        }
      }
      hasPendingUserEditsRef.current = false;
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('synced');
    }
    addLog('Update Tanda Tangan & Stempel', `Memperbarui tanda tangan ${updated.namaKepalaMadrasah} dan stempel resmi`, 'edit');
  };

  const handleUpdateCardConfig = async (updated: CardConfig) => {
    const editTime = Date.now();
    lastCardConfigEditTimeRef.current = editTime;
    cardConfigRef.current = updated;
    markUserEdited();
    try {
      localStorage.setItem('mi_card_config_updated_at', editTime.toString());
      localStorage.setItem('mi_card_config', JSON.stringify(updated));
    } catch (e) {}
    setCardConfig(updated);
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('mi_realtime_channel');
        bc.postMessage({ type: 'local_sync', payload: { cardConfig: updated }, timestamp: editTime });
        bc.close();
      }
    } catch (e) {}
    setSyncStatus('saving');
    setPersistentItem('mi_card_config', updated).catch(() => {});
    saveToPermanentVault(undefined, undefined, updated, undefined).catch(() => {});

    try {
      const res = await saveCentralServerData({
        cardConfig: updated,
        madrasah: madrasahRef.current,
        students: studentsRef.current,
      });
      if (res && res.lastUpdated) {
        lastKnownServerTimeRef.current = res.lastUpdated;
        setLastServerUpdate(res.lastUpdated);
        const resTime = new Date(res.lastUpdated).getTime();
        if (resTime > lastCardConfigEditTimeRef.current) {
          lastCardConfigEditTimeRef.current = resTime;
        }
      }
      // Hold protection against incoming server broadcasts for 3 seconds
      if (userEditTimerRef.current) {
        clearTimeout(userEditTimerRef.current);
      }
      userEditTimerRef.current = setTimeout(() => {
        hasPendingUserEditsRef.current = false;
      }, 3000);
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('synced');
    }
  };

  const handleUpdateLoaderConfig = async (updated: PageLoaderConfig) => {
    markUserEdited();
    setLoaderConfig(updated);
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('mi_realtime_channel');
        bc.postMessage({ type: 'local_sync', payload: { loaderConfig: updated }, timestamp: Date.now() });
        bc.close();
      }
    } catch (e) {}
    setSyncStatus('saving');
    try {
      localStorage.setItem('mi_loader_config', JSON.stringify(updated));
    } catch (e) {}
    try {
      const res = await saveCentralServerData({ loaderConfig: updated });
      if (res && res.lastUpdated) {
        setLastServerUpdate(res.lastUpdated);
        lastKnownServerTimeRef.current = res.lastUpdated;
      }
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('synced');
    }
    addLog('Kustomisasi Page Loader', `Memperbarui tema (${updated.theme}), logo (${updated.logoType}), dan durasi Splash Screen`, 'edit');
  };

  const handleAddNewStudent = () => {
    markUserEdited();
    const newStudent: Student = {
      id: `std-${Date.now()}`,
      nama: 'NAMA SISWA BARU',
      nisn: `01${Math.floor(10000000 + Math.random() * 90000000)}`,
      nis: `2324${(students.length + 1).toString().padStart(4, '0')}`,
      tempatLahir: madrasah.kotaKab.replace('Kab. ', '').replace('Kota ', ''),
      tanggalLahir: '01 Januari 2015',
      jenisKelamin: 'L',
      kelas: 'I - Abu Bakar Ash-Shiddiq',
      tahunAjaran: madrasah.tahunPelajaran || '2025/2026',
      agama: 'Islam',
      golonganDarah: 'O',
      alamat: madrasah.alamat,
      fotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&fit=crop&q=80',
      berlakuSampai: 'Selama Menjadi Siswa',
    };

    const updatedList = [...students, newStudent];
    setStudents(updatedList);
    setSelectedStudentId(newStudent.id);
    setActiveTab('student');
    try {
      localStorage.setItem('mi_students_data', JSON.stringify(updatedList));
      localStorage.setItem('mi_students_list', JSON.stringify(updatedList));
      localStorage.setItem('mi_students_updated_at', Date.now().toString());
    } catch (e) {}
    saveCentralServerData({ students: updatedList }).catch(() => {});
    addLog('Tambah Siswa Baru', `Menambahkan siswa baru: ${newStudent.nama}`, 'create');
  };

  const handleImportEmisStudents = async (newStudents: Student[], mode: StudentImportMode = 'merge') => {
    isImportingOrSavingRef.current = true;
    hasPendingUserEditsRef.current = true;
    markUserEdited();
    isExplicitlyClearedRef.current = false;

    let finalStudents: Student[] = [];

    if (mode === 'replace') {
      finalStudents = newStudents;
    } else if (mode === 'append') {
      // Ensure all new students have unique IDs
      const existingIds = new Set(students.map((s) => s.id));
      const normalizedNew = newStudents.map((s) => {
        let uniqueId = s.id || `std-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        while (existingIds.has(uniqueId)) {
          uniqueId = `std-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        }
        existingIds.add(uniqueId);
        return { ...s, id: uniqueId };
      });
      finalStudents = [...students, ...normalizedNew];
    } else {
      // SMART MERGE (Default & Safe): Preserves existing classes & non-overlapping records!
      const currentMapByNisn = new Map<string, Student>();
      const currentMapByNis = new Map<string, Student>();
      const currentMapByName = new Map<string, Student>();

      students.forEach((s) => {
        if (s.nisn && s.nisn.trim()) currentMapByNisn.set(s.nisn.trim(), s);
        if (s.nis && s.nis.trim()) currentMapByNis.set(s.nis.trim(), s);
        if (s.nama && s.nama.trim()) currentMapByName.set(s.nama.trim().toUpperCase(), s);
      });

      const updatedExistingIds = new Set<string>();
      const brandNewList: Student[] = [];

      newStudents.forEach((newS) => {
        const nisnKey = newS.nisn ? newS.nisn.trim() : '';
        const nisKey = newS.nis ? newS.nis.trim() : '';
        const nameKey = newS.nama ? newS.nama.trim().toUpperCase() : '';

        const matched =
          (nisnKey && currentMapByNisn.get(nisnKey)) ||
          (nisKey && currentMapByNis.get(nisKey)) ||
          (nameKey && currentMapByName.get(nameKey));

        if (matched) {
          updatedExistingIds.add(matched.id);
        } else {
          brandNewList.push(newS);
        }
      });

      // Construct final students array
      finalStudents = students.map((oldS) => {
        const nisnKey = oldS.nisn ? oldS.nisn.trim() : '';
        const nisKey = oldS.nis ? oldS.nis.trim() : '';
        const nameKey = oldS.nama ? oldS.nama.trim().toUpperCase() : '';

        const updateFromExcel = newStudents.find(
          (ns) =>
            (nisnKey && ns.nisn && ns.nisn.trim() === nisnKey) ||
            (nisKey && ns.nis && ns.nis.trim() === nisKey) ||
            (nameKey && ns.nama && ns.nama.trim().toUpperCase() === nameKey)
        );

        if (updateFromExcel) {
          return {
            ...oldS,
            ...updateFromExcel,
            id: oldS.id, // preserve stable ID
            fotoUrl: updateFromExcel.fotoUrl || oldS.fotoUrl, // preserve custom photo if excel has none
          };
        }
        return oldS;
      });

      // Append brand new students from this import
      finalStudents = [...finalStudents, ...brandNewList];
    }

    // Update state immediately
    setStudents(finalStudents);
    if (finalStudents.length > 0) {
      setSelectedStudentId(finalStudents[0].id);
    }

    // 1. Immediately persist to localStorage and IndexedDB with multi-vault
    try {
      const ts = Date.now().toString();
      localStorage.setItem('mi_students_data', JSON.stringify(finalStudents));
      localStorage.setItem('mi_students_list', JSON.stringify(finalStudents));
      localStorage.setItem('mi_students_backup_vault', JSON.stringify(finalStudents));
      localStorage.setItem('mi_students_updated_at', ts);
      setPersistentItem('mi_students_data', finalStudents).catch(() => {});
      saveToPermanentVault(undefined, finalStudents, undefined, undefined).catch(() => {});
    } catch (e) {
      console.error('Local persistence write error:', e);
    }

    // 2. Direct immediate sync to backend server database
    setSyncStatus('saving');
    try {
      const res = await saveCentralServerData({
        madrasah: madrasahRef.current,
        students: finalStudents,
        cardConfig: cardConfigRef.current,
        loaderConfig,
        activityLogs,
      });
      if (res && res.lastUpdated) {
        setLastServerUpdate(res.lastUpdated);
        lastKnownServerTimeRef.current = res.lastUpdated;
        const resTime = new Date(res.lastUpdated).getTime();
        if (resTime > lastCardConfigEditTimeRef.current) {
          lastCardConfigEditTimeRef.current = resTime;
        }
      }
    } catch (err) {
      console.error('Save to central server database failed:', err);
    } finally {
      setSyncStatus('synced');
      setTimeout(() => {
        isImportingOrSavingRef.current = false;
      }, 5000);
    }

    if (mode === 'replace') {
      addLog('Impor Excel EMIS (Replace)', `Mengganti seluruh data siswa dengan ${newStudents.length} siswa dari berkas Excel`, 'backup');
    } else if (mode === 'append') {
      addLog('Impor Excel EMIS (Append)', `Menambahkan ${newStudents.length} siswa baru ke dalam database`, 'backup');
    } else {
      addLog('Impor Excel EMIS (Smart Merge)', `Menggabungkan ${newStudents.length} data siswa dari Excel. Total database: ${finalStudents.length} siswa`, 'backup');
    }
  };

  const handleRestoreData = (newMadrasah: MadrasahInfo, newStudents: Student[], newConfig: CardConfig) => {
    markUserEdited();
    setMadrasah(newMadrasah);
    setStudents(newStudents);
    setCardConfig(newConfig);
    if (newStudents.length > 0) {
      setSelectedStudentId(newStudents[0].id);
    }
    addLog('Pulihkan Database JSON', `Memulihkan ${newStudents.length} siswa dan data madrasah`, 'backup');
  };

  const handleResetToDefault = () => {
    markUserEdited();
    setMadrasah(INITIAL_MADRASAH);
    setStudents(INITIAL_STUDENTS);
    setCardConfig(INITIAL_CARD_CONFIG);
    setSelectedStudentId(INITIAL_STUDENTS[0].id);
    localStorage.removeItem('mi_students_data');
    localStorage.removeItem('mi_madrasah_info');
    localStorage.removeItem('mi_card_config');
    addLog('Reset Pengaturan Default', 'Mengembalikan seluruh data ke standar awal Kemenag', 'backup');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('card_editor');
    localStorage.removeItem('mi_admin_user');
    addLog('Admin Logout', 'Sesi admin berakhir', 'auth');
  };

  const handleSwitchView = (view: 'card_editor' | 'admin_dashboard') => {
    if (view === 'admin_dashboard' && (!currentUser || !currentUser.isAuthenticated)) {
      setIsLoginModalOpen(true);
      return;
    }
    setCurrentView(view);
  };

  const handleLoginSuccess = (user: AdminUser) => {
    setCurrentUser(user);
    setCurrentView('admin_dashboard');
    addLog('Admin Login', `Login berhasil sebagai ${user.name} (${user.role})`, 'auth');
  };

  // Show page loader during first mount if enabled
  if (isInitialLoading && loaderConfig.enabled) {
    return (
      <InitialPageLoader 
        config={loaderConfig} 
        progress={loadingProgress} 
        statusText={loadingStatus}
        madrasahLogoUrl={madrasah.logoMadrasahUrl || madrasah.logoAplikasiUrl}
        onSkip={() => setIsInitialLoading(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* ICONIC UNIFIED TOP HEADER BAR */}
      <AdminHeaderBar
        currentUser={currentUser}
        currentView={currentView}
        madrasah={madrasah}
        onSwitchView={handleSwitchView}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenPlesk={() => setIsPleskModalOpen(true)}
        onOpenBackupRestore={() => setIsBackupRestoreModalOpen(true)}
        onOpenEmisExcelImport={() => setIsEmisExcelModalOpen(true)}
        onOpenSignaturePad={() => setIsSignaturePadOpen(true)}
        isEditLocked={isEditLocked}
        onToggleEditLock={() => setIsEditLocked(!isEditLocked)}
        syncStatus={syncStatus}
        onManualSync={handleManualSync}
        onForceRefresh={handleForceRefresh}
        isRealtimeConnected={isRealtimeConnected}
      />

      {/* EDIT MODE LOCK NOTICE IF LOCKED */}
      {isEditLocked && currentView === 'admin_dashboard' && currentUser?.isAuthenticated && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-1.5 text-center text-xs text-amber-300 flex items-center justify-center gap-2 no-print">
          <Lock className="w-3.5 h-3.5" />
          <span>Mode Edit saat ini dikunci untuk mencegah perubahan tidak disengaja.</span>
        </div>
      )}

      {/* MAIN VIEW SWITCHING: DASHBOARD ADMIN (PROTECTED) vs CARD DESIGN EDITOR */}
      {currentView === 'admin_dashboard' && currentUser?.isAuthenticated ? (
        <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex-1 w-full overflow-x-hidden no-print">
          <AdminDashboardView
            currentUser={currentUser}
            madrasah={madrasah}
            students={students}
            config={cardConfig}
            activityLogs={activityLogs}
            onUpdateMadrasah={handleUpdateMadrasah}
            onExplicitSaveMadrasah={handleExplicitSaveMadrasah}
            onUpdateStudents={handleUpdateStudents}
            onUpdateConfig={handleUpdateCardConfig}
            onResetMadrasahToDefault={handleResetToDefault}
            onSelectStudent={(s) => setSelectedStudentId(s.id)}
            onOpenSignaturePad={() => setIsSignaturePadOpen(true)}
            onOpenEmisExcelImport={() => setIsEmisExcelModalOpen(true)}
            onOpenPrintSheet={(targetStudent) => {
              if (targetStudent) {
                setSelectedStudentId(targetStudent.id);
                setPrintTargetStudentIds([targetStudent.id]);
              } else {
                setPrintTargetStudentIds(undefined);
              }
              setIsPrintModalOpen(true);
            }}
            onOpenPlesk={() => setIsPleskModalOpen(true)}
            onOpenBackupRestore={() => setIsBackupRestoreModalOpen(true)}
            onOpenActivityLogs={() => setIsActivityLogModalOpen(true)}
            onAddNewStudent={handleAddNewStudent}
            onSwitchToCardEditor={() => setCurrentView('card_editor')}
            onOpenSuratAktif={(student) => {
              if (student) setSelectedStudentId(student.id);
              setIsSuratAktifModalOpen(true);
            }}
            onOpenPageLoaderSettings={() => setIsPageLoaderSettingsOpen(true)}
            loaderConfig={loaderConfig}
            onUpdateLoaderConfig={handleUpdateLoaderConfig}
            syncStatus={syncStatus}
            onManualSync={handleManualSync}
            onRefreshFromServer={handleForceRefresh}
            lastServerUpdate={lastServerUpdate}
          />
        </main>
      ) : (
        /* PUBLIC PORTAL: CLEAN CARD PREVIEW & STUDENT SERVICES */
        <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex-1 w-full space-y-5 overflow-x-hidden no-print">
          {/* PUBLIC STUDENT SELECTION STRIP (GROUPED BY CLASS) */}
          <div className="bg-slate-900/90 p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-400 flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight truncate">
                    Pilih Data Siswa Aktif
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {students.length} Siswa
                  </span>
                  {distinctClasses.length > 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {distinctClasses.length} Rombel/Kelas
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Pilih siswa berdasarkan kelompok kelas untuk pratinjau kartu CR80 & cetak surat aktif.
                </p>
              </div>
            </div>

            {/* Quick Student & Class Selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
              {students.length > 0 ? (
                <>
                  {/* Filter Kelas Dropdown */}
                  {distinctClasses.length > 1 && (
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Kelas:</span>
                      <select
                        value={selectedClassFilter}
                        onChange={(e) => handleClassFilterChange(e.target.value)}
                        className="bg-transparent text-amber-300 font-bold text-xs outline-none cursor-pointer pr-1"
                      >
                        <option value="ALL" className="bg-slate-900 text-slate-200">
                          Semua Kelas ({students.length})
                        </option>
                        {groupedStudentsByClass.map((group) => (
                          <option key={group.className} value={group.className} className="bg-slate-900 text-amber-300">
                            Kelas {group.className} ({group.students.length})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Dropdown Siswa Dikelompokkan per Kelas dengan Optgroup */}
                  <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-700 shadow-inner">
                    <User className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full sm:w-auto bg-transparent text-emerald-300 font-bold text-xs outline-none cursor-pointer max-w-full sm:max-w-xs truncate"
                    >
                      {displayedGroups.map((group) => (
                        <optgroup 
                          key={group.className} 
                          label={`📁 KELAS: ${group.className} (${group.students.length} Siswa)`}
                          className="bg-slate-900 text-amber-300 font-bold py-1"
                        >
                          {group.students.map((s) => (
                            <option 
                              key={s.id} 
                              value={s.id} 
                              className="bg-slate-950 text-slate-100 font-normal py-1"
                            >
                              {s.nama} {s.nisn ? `(NISN: ${s.nisn})` : ''}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <span className="text-xs text-slate-400 italic bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                  (Belum ada data siswa terdaftar)
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT COLUMN: Public Student Information & Services (7 cols) */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              {/* 1. BIODATA SISWA CARD (READ-ONLY) */}
              <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Informasi Biodata Siswa
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    students.length > 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {students.length > 0 ? 'STATUS: AKTIF (EMIS)' : 'STATUS: KOSONG'}
                  </span>
                </div>

                {students.length === 0 ? (
                  <div className="text-center py-6 px-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                    <User className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs font-semibold text-slate-300">Belum Ada Data Siswa Terdaftar</p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Silakan masuk ke menu Admin Operator untuk mengimpor file EMIS Excel atau menambahkan data siswa secara manual.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    {/* Photo with Frame */}
                    <div className="flex-shrink-0">
                      <img
                        src={currentStudent.fotoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&fit=crop'}
                        alt={currentStudent.nama || 'Foto Siswa'}
                        className="w-24 h-32 object-cover rounded-xl border-2 border-emerald-500/50 shadow-md bg-slate-950"
                      />
                    </div>

                    {/* Student Details Grid */}
                    <div className="flex-1 w-full space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Nama Lengkap Siswa:</span>
                        <span className="text-sm font-extrabold text-white">{currentStudent.nama || '-'}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 uppercase block">NISN (10 Digit):</span>
                          <span className="text-xs font-mono font-bold text-amber-300">{currentStudent.nisn || '-'}</span>
                        </div>
                        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 uppercase block">Nomor Induk (NIS):</span>
                          <span className="text-xs font-mono font-semibold text-slate-200">{currentStudent.nis || '-'}</span>
                        </div>
                        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 uppercase block">Kelas:</span>
                          <span className="text-xs font-bold text-emerald-400">{currentStudent.kelas || '-'}</span>
                        </div>
                        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 uppercase block">Tahun Pelajaran:</span>
                          <span className="text-xs font-mono font-bold text-amber-300">{madrasah.tahunPelajaran || currentStudent.tahunAjaran || '2025/2026'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 uppercase block">Tempat, Tanggal Lahir:</span>
                          <span className="text-xs text-slate-200">
                            {currentStudent.tempatLahir ? `${currentStudent.tempatLahir}, ` : ''}{currentStudent.tanggalLahir || '-'}
                          </span>
                        </div>
                        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 uppercase block">Jenis Kelamin / Agama:</span>
                          <span className="text-xs text-slate-200">
                            {currentStudent.jenisKelamin === 'L' ? 'Laki-laki (Ikhwan)' : (currentStudent.jenisKelamin === 'P' ? 'Perempuan (Akhwat)' : '-')} • {currentStudent.agama || '-'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                        <span className="text-[9px] text-slate-400 uppercase block">Alamat Domisili:</span>
                        <span className="text-xs text-slate-300">{currentStudent.alamat || '-'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. PUBLIC ESSENTIAL ACTION SERVICES (CETAK KARTU & SURAT AKTIF) */}
              <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Layanan Mandiri Siswa
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setPrintTargetStudentIds([currentStudent.id]);
                      setIsPrintModalOpen(true);
                      addLog('Cetak Kartu Siswa', `Membuka dialog cetak kartu untuk ${currentStudent.nama}`, 'print');
                    }}
                    className="p-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 shadow-lg transition active:scale-95 text-left"
                  >
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Printer className="w-5 h-5 text-emerald-100" />
                    </div>
                    <div>
                      <div className="font-extrabold text-white text-xs">Cetak Kartu Pelajar</div>
                      <div className="text-[10px] text-emerald-100/80 font-normal">Format Standar PVC CR80 (2 Kolom • 4/Lembar)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsSuratAktifModalOpen(true);
                      addLog('Surat Aktif Siswa', `Membuat Surat Keterangan Aktif untuk ${currentStudent.nama}`, 'print');
                    }}
                    className="p-3.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 border border-slate-700 hover:border-amber-500/50 transition active:scale-95 text-left"
                  >
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <FileText className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="font-extrabold text-white text-xs">Surat Keterangan Aktif</div>
                      <div className="text-[10px] text-slate-400 font-normal">Format Resmi Kemenag A4/F4</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Live Interactive 3D Card Preview (5 cols) */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              {/* Card Preview Component */}
              <div className="bg-slate-900/80 rounded-2xl p-3 sm:p-4 border border-slate-800 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileBadge className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Pratinjau Kartu Siswa
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {students.length === 0 && (
                      <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                        Sample Desain
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      CR80 PVC
                    </span>
                  </div>
                </div>

                <Card3DPreview
                  student={{
                    ...(currentStudent && currentStudent.nama ? currentStudent : SAMPLE_STUDENT),
                    tahunAjaran: madrasah.tahunPelajaran || currentStudent?.tahunAjaran || '2025/2026',
                  }}
                  madrasah={madrasah}
                  config={cardConfig}
                />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ICONIC COMPACT STICKY FOOTER NAVIGATION */}
      <footer className="mt-auto sticky bottom-0 z-30 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-md py-1.5 sm:py-2 text-center text-xs text-slate-400 no-print shadow-2xl">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-2">
          
          {/* LEFT: School, CR80 Standard & Dev Attribution */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-shrink-0">
            <span className="hidden xl:inline font-semibold text-slate-300">
              {madrasah.namaMadrasah}
            </span>
            <span className="hidden xl:inline">•</span>
            <span className="hidden md:flex text-emerald-400 items-center gap-1 font-medium text-[10px]">
              <CheckCircle2 className="w-3 h-3" /> CR80 PVC
            </span>
            <span className="hidden md:inline text-slate-700">•</span>
            <span className="text-amber-400 font-medium text-[10px] sm:text-[11px] flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/25">
              Dev: Jaenal Maskun
            </span>
          </div>

          {/* CENTER: COMPACT ICONIC QUICK ACTION BAR */}
          <div className="flex items-center justify-end sm:justify-center gap-1 sm:gap-1.5 flex-nowrap overflow-x-auto py-0.5 max-w-full">
            {currentView === 'card_editor' ? (
              /* PUBLIC PORTAL ICONIC MENU */
              <>
                <button
                  onClick={() => setCurrentView('card_editor')}
                  className="px-2 py-1 rounded-lg bg-emerald-600/90 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition active:scale-95 border border-emerald-400/40 whitespace-nowrap"
                  title="Tampilan Pratinjau Kartu Siswa"
                >
                  <CreditCard className="w-3 h-3 text-emerald-200" />
                  <span>Kartu</span>
                </button>

                <button
                  onClick={() => {
                    setIsPrintModalOpen(true);
                    addLog('Buka Cetak Kartu Massal', 'Membuka dialog cetak lembar A4 dari bilah bawah', 'print');
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-[11px] flex items-center gap-1 border border-slate-800 hover:border-slate-700 transition active:scale-95 whitespace-nowrap"
                  title="Cetak Lembar Massal A4"
                >
                  <Printer className="w-3 h-3 text-emerald-400" />
                  <span>Cetak A4</span>
                </button>

                <button
                  onClick={() => {
                    setIsSuratAktifModalOpen(true);
                    addLog('Buka Surat Keterangan Aktif', `Membuka form surat aktif untuk ${currentStudent.nama}`, 'print');
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-[11px] flex items-center gap-1 border border-slate-800 hover:border-slate-700 transition active:scale-95 whitespace-nowrap"
                  title="Surat Keterangan Aktif Belajar (Kemenag)"
                >
                  <FileText className="w-3 h-3 text-amber-400" />
                  <span>Surat Aktif</span>
                </button>

                <button
                  onClick={() => {
                    setIsScannerModalOpen(true);
                    addLog('Verifikasi Barcode/QR', `Memeriksa otentikasi data ${currentStudent.nama}`, 'print');
                  }}
                  className="p-1 sm:px-2 sm:py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-[11px] flex items-center gap-1 border border-slate-800 hover:border-slate-700 transition active:scale-95 whitespace-nowrap"
                  title="Pindai QR / Barcode Kartu Pelajar"
                >
                  <QrCode className="w-3 h-3 text-teal-400" />
                  <span className="hidden sm:inline">Pindai</span>
                </button>

                <button
                  onClick={() => setShowHelpModal(true)}
                  className="p-1 sm:px-1.5 sm:py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1 border border-slate-800 transition active:scale-95"
                  title="Panduan Cetak PVC & Pengaturan Browser"
                >
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                </button>

                <button
                  onClick={() => handleSwitchView('admin_dashboard')}
                  className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-[11px] flex items-center gap-1 border border-amber-500/30 transition active:scale-95 whitespace-nowrap"
                  title="Masuk ke Pusat Pengelolaan Admin"
                >
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  <span>Admin</span>
                </button>
              </>
            ) : (
              /* ADMIN DASHBOARD ICONIC MENU */
              <>
                <button
                  onClick={() => setCurrentView('card_editor')}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-[11px] flex items-center gap-1 border border-slate-800 hover:border-slate-700 transition active:scale-95 whitespace-nowrap"
                  title="Lihat Pratinjau Kartu Siswa"
                >
                  <Eye className="w-3 h-3 text-emerald-400" />
                  <span>Kartu</span>
                </button>

                <button
                  onClick={() => setCurrentView('admin_dashboard')}
                  className="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-xs transition active:scale-95 whitespace-nowrap"
                  title="Dashboard Master Admin"
                >
                  <LayoutDashboard className="w-3 h-3 text-slate-950" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => setIsEmisExcelModalOpen(true)}
                  className="px-1.5 sm:px-2 py-1 rounded-lg bg-slate-900 hover:bg-emerald-950/60 text-slate-200 hover:text-emerald-300 font-medium text-[11px] flex items-center gap-1 border border-slate-800 hover:border-emerald-500/40 transition active:scale-95 whitespace-nowrap"
                  title="Impor Data Excel EMIS 4.0"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                  <span className="hidden sm:inline">EMIS</span>
                </button>

                <button
                  onClick={() => setIsSignaturePadOpen(true)}
                  className="p-1 sm:px-2 sm:py-1 rounded-lg bg-slate-900 hover:bg-teal-950/60 text-slate-200 hover:text-teal-300 font-medium text-[11px] flex items-center gap-1 border border-slate-800 hover:border-teal-500/40 transition active:scale-95 whitespace-nowrap"
                  title="Gores Tanda Tangan & Stempel Digital"
                >
                  <PenTool className="w-3 h-3 text-teal-400" />
                  <span className="hidden sm:inline">TTD</span>
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="p-1 sm:px-2 sm:py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-[11px] flex items-center gap-1 border border-slate-800 hover:border-slate-700 transition active:scale-95 whitespace-nowrap"
                  title="Cetak Lembar Massal A4"
                >
                  <Printer className="w-3 h-3 text-blue-400" />
                  <span className="hidden sm:inline">A4</span>
                </button>

                <button
                  onClick={() => setIsSuratAktifModalOpen(true)}
                  className="p-1 sm:px-2 sm:py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-[11px] flex items-center gap-1 border border-slate-800 hover:border-slate-700 transition active:scale-95 whitespace-nowrap"
                  title="Surat Keterangan Aktif Belajar"
                >
                  <FileText className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Surat</span>
                </button>

                <button
                  onClick={() => setIsPageLoaderSettingsOpen(true)}
                  className="p-1 sm:px-2 sm:py-1 rounded-lg bg-slate-900 hover:bg-amber-950/60 text-slate-200 hover:text-amber-300 font-medium text-[11px] flex items-center gap-1 border border-slate-800 hover:border-amber-500/40 transition active:scale-95 whitespace-nowrap"
                  title="Kustomisasi Splash Page Loader"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Loader</span>
                </button>

                <button
                  onClick={() => setIsBackupRestoreModalOpen(true)}
                  className="p-1 sm:px-1.5 sm:py-1 rounded-lg bg-slate-900 hover:bg-violet-950/60 text-slate-300 hover:text-violet-300 font-medium text-[11px] flex items-center gap-1 border border-slate-800 hover:border-violet-500/40 transition active:scale-95"
                  title="Cadangan & Pulihkan Database JSON"
                >
                  <Database className="w-3 h-3 text-violet-400" />
                  <span className="hidden md:inline">Backup</span>
                </button>

                <button
                  onClick={() => setIsActivityLogModalOpen(true)}
                  className="p-1 sm:px-1.5 sm:py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-200 text-[11px] flex items-center gap-1 border border-slate-800 transition active:scale-95"
                  title="Riwayat & Audit Log Aktivitas"
                >
                  <History className="w-3 h-3 text-slate-400" />
                </button>

                {/* EKSPOR PLESK HANYA DI DASHBOARD ADMIN */}
                <button
                  onClick={() => setIsPleskModalOpen(true)}
                  className="px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-amber-300 font-bold text-[11px] flex items-center gap-1 border border-emerald-500/40 hover:border-emerald-400 transition active:scale-95 shadow-xs whitespace-nowrap"
                  title="Unduh Paket ZIP Siap Pasang ke Web Hosting Plesk"
                >
                  <Server className="w-3 h-3 text-amber-400" />
                  <span>Plesk</span>
                </button>
              </>
            )}
          </div>

          {/* RIGHT: Quick Badge / CR80 PVC Standard */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[9px]">
              CR80
            </span>
          </div>
        </div>
      </footer>

      {/* SIGNATURE PAD & CAP MODAL */}
      <SignaturePadModal
        isOpen={isSignaturePadOpen}
        onClose={() => setIsSignaturePadOpen(false)}
        madrasah={madrasah}
        onSaveSignature={handleSaveSignature}
      />

      {/* EMIS EXCEL IMPORT MODAL */}
      <EmisExcelImportModal
        isOpen={isEmisExcelModalOpen}
        onClose={() => setIsEmisExcelModalOpen(false)}
        onImportSuccess={handleImportEmisStudents}
        currentStudentCount={students.length}
        existingStudents={students}
      />

      {/* PLESK DEPLOYMENT ZIP MODAL */}
      <PleskExportModal
        isOpen={isPleskModalOpen}
        onClose={() => setIsPleskModalOpen(false)}
        madrasah={madrasah}
        students={students}
        config={cardConfig}
        loaderConfig={loaderConfig}
      />

      {/* ADMIN LOGIN MODAL */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentUser={currentUser}
      />

      {/* ACTIVITY LOG MODAL */}
      <ActivityLogModal
        isOpen={isActivityLogModalOpen}
        onClose={() => setIsActivityLogModalOpen(false)}
        logs={activityLogs}
        onClearLogs={() => {
          setActivityLogs([]);
          localStorage.removeItem('mi_activity_logs');
        }}
      />

      {/* BACKUP & RESTORE MODAL */}
      <BackupRestoreModal
        isOpen={isBackupRestoreModalOpen}
        onClose={() => setIsBackupRestoreModalOpen(false)}
        madrasah={madrasah}
        students={students}
        config={cardConfig}
        onRestoreData={handleRestoreData}
        onResetToDefault={handleResetToDefault}
      />

      {/* PRINT SHEET MODAL */}
      <PrintSheetModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        students={students}
        madrasah={madrasah}
        config={cardConfig}
        initialSelectedStudentIds={printTargetStudentIds}
      />

      {/* SURAT KETERANGAN AKTIF BELAJAR MODAL */}
      <SuratKeteranganAktifModal
        isOpen={isSuratAktifModalOpen}
        onClose={() => setIsSuratAktifModalOpen(false)}
        madrasah={madrasah}
        students={students}
        currentStudent={currentStudent}
        onSelectStudent={(s) => setSelectedStudentId(s.id)}
        cardConfig={cardConfig}
      />

      {/* PAGE LOADER / SPLASH SCREEN CUSTOMIZATION MODAL */}
      <PageLoaderSettingsModal
        isOpen={isPageLoaderSettingsOpen}
        onClose={() => setIsPageLoaderSettingsOpen(false)}
        config={loaderConfig}
        onSave={handleUpdateLoaderConfig}
        madrasah={madrasah}
      />

      {/* SCANNER & VERIFICATION MODAL */}

      <CardScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        student={currentStudent}
        madrasah={madrasah}
      />

      {/* ACTION PROCESSING OVERLAY */}
      <ActionProcessingOverlay
        isOpen={actionOverlay.isOpen}
        title={actionOverlay.title}
        subtitle={actionOverlay.subtitle}
        progress={actionOverlay.progress}
        iconType={actionOverlay.iconType}
      />

      {/* PRINTING & PVC CARD GUIDE MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                Panduan Pembuatan & Cetak Kartu Pelajar MI
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 space-y-1">
                <h4 className="font-bold text-emerald-400">1. Ukuran Standar Kartu (CR80)</h4>
                <p>
                  Ukuran kartu diatur presisi sesuai standar internasional ISO/IEC 7810 ID-1 (CR80) yaitu <strong>85.6 mm × 53.98 mm</strong>. Cocok untuk mesin printer PVC (Evolis, Zebra, Fargo) maupun cetak kertas biasa.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 space-y-1">
                <h4 className="font-bold text-emerald-400">2. Cara Cetak PVC Card / Kertas Tebal</h4>
                <p>
                  Gunakan kertas <strong>PVC Inkjet Card Sheet (3 layer)</strong> atau <strong>Art Paper / Photo Paper Glossy 230-260 gsm</strong>. Setelah dicetak, potong menggunakan mesin pemotong ID Card (ID Card Cutter).
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 space-y-1">
                <h4 className="font-bold text-emerald-400">3. Pengaturan Print di Browser</h4>
                <p>
                  Saat jendela print muncul, pastikan <strong>Scale</strong> diatur ke <strong>100% / Default</strong>, hilangkan margin (None/Default), dan centang opsi <strong>Background Graphics (Grafis Latar Belakang)</strong> agar warna dan logo tercetak sempurna.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
