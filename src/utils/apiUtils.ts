/**
 * Authoritative API Client & Universal Endpoint Discovery
 * Handles automatic base path detection, subfolder deployments,
 * MySQL-authoritative state synchronizations, and zero-latency caching.
 */

let activeEndpointCacheByType: Record<string, string> = {};

/**
 * Returns the base path of the current app (e.g. '/' or '/kartu-pelajar/')
 */
export function getAppBasePath(): string {
  if (typeof window === 'undefined') return '/';
  const path = window.location.pathname;
  if (!path || path === '/') return '/';
  // Strip filename if present (e.g. /sub/index.html -> /sub/)
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash === -1) return '/';
  return path.substring(0, lastSlash + 1);
}

/**
 * Generates an ordered list of candidate URLs for a given API script.
 * Gives immediate priority to direct PHP scripts for Plesk/cPanel,
 * and falls back to Node.js Express endpoints.
 */
export function getCandidateEndpoints(endpointType: 'data' | 'version' | 'status' | 'clear'): string[] {
  const base = getAppBasePath();
  const candidates: string[] = [];

  // If we already know which endpoint answered successfully for this specific type, put it first!
  if (activeEndpointCacheByType[endpointType]) {
    candidates.push(activeEndpointCacheByType[endpointType]);
  }

  if (endpointType === 'data') {
    candidates.push(
      `${base}api/data`,
      `api/data`,
      `/api/data`,
      `${base}api/data.php`,
      `api/data.php`,
      `/api/data.php`,
      `${base}api/sync.php`
    );
  } else if (endpointType === 'version') {
    candidates.push(
      `${base}api/version`,
      `api/version`,
      `/api/version`,
      `${base}api/version.php`,
      `api/version.php`,
      `/api/version.php`,
      `${base}api/last-updated`
    );
  } else if (endpointType === 'status') {
    candidates.push(
      `${base}api/db-status`,
      `api/db-status`,
      `/api/db-status`,
      `${base}api/data.php?action=db_status`,
      `api/data.php?action=db_status`,
      `/api/data.php?action=db_status`
    );
  } else if (endpointType === 'clear') {
    candidates.push(
      `${base}api/students/clear`,
      `api/students/clear`,
      `/api/students/clear`,
      `${base}api/data.php?action=clear_students`,
      `api/data.php?action=clear_students`,
      `/api/data.php?action=clear_students`
    );
  }

  // De-duplicate while preserving order
  return Array.from(new Set(candidates));
}

/**
 * Fetch authoritative central state from server (MySQL / Central DB)
 */
export async function fetchServerCentralState(): Promise<{
  success: boolean;
  data: any | null;
  mysqlConnected?: boolean;
  dbType?: string;
  sourceUrl?: string;
}> {
  const cacheBuster = `t=${Date.now()}&r=${Math.random().toString(36).substring(7)}`;
  const endpoints = getCandidateEndpoints('data').map((url) => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${cacheBuster}`;
  });

  const fetchSingle = async (urlWithQuery: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(urlWithQuery, {
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Response is not JSON');
      const json = await res.json();
      if (json && (json.success || json.status === 'success') && json.data) {
        // Cache the raw base url without query params as the confirmed working endpoint
        const rawUrl = urlWithQuery.split('?')[0];
        activeEndpointCacheByType['data'] = rawUrl;
        return {
          success: true,
          data: json.data,
          mysqlConnected: json.data?.mysqlConnected ?? json.mysqlConnected ?? false,
          dbType: json.data?.dbType ?? json.dbType ?? 'mysql',
          sourceUrl: rawUrl,
        };
      }
      throw new Error('Invalid JSON format');
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  try {
    return await Promise.any(endpoints.map(fetchSingle));
  } catch (e) {
    return {
      success: false,
      data: null,
    };
  }
}

/**
 * Save authoritative state to server (MySQL / Central DB)
 */
export async function saveServerCentralState(payload: any): Promise<{
  success: boolean;
  lastUpdated?: string;
  totalStudents?: number;
  mysqlConnected?: boolean;
  mysqlError?: string | null;
  message?: string;
}> {
  const endpoints = getCandidateEndpoints('data');

  for (const url of endpoints) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const json = await res.json();
          if (json && (json.success || json.status === 'success')) {
            activeEndpointCacheByType['data'] = url;
            return {
              success: true,
              lastUpdated: json.lastUpdated,
              totalStudents: json.totalStudents,
              mysqlConnected: json.mysqlConnected,
              mysqlError: json.mysqlError,
              message: json.message,
            };
          }
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      // Try next candidate
    }
  }

  return { success: false, message: 'Semua endpoint server tidak merespons' };
}

/**
 * Check lightweight server version / lastUpdated timestamp
 */
export async function fetchServerVersion(): Promise<{
  success: boolean;
  lastUpdated?: string;
  totalStudents?: number;
  tahunPelajaran?: string;
  madrasahName?: string;
} | null> {
  const cacheBuster = `t=${Date.now()}`;
  const endpoints = getCandidateEndpoints('version').map((url) => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${cacheBuster}`;
  });

  const fetchSingle = async (url: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store',
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Not JSON');
      const json = await res.json();
      if (!json) throw new Error('Empty');

      const rawUrl = url.split('?')[0];
      activeEndpointCacheByType['version'] = rawUrl;

      // Extract unified version metadata from either lightweight version endpoint or full data endpoint
      const lastUpdated = json.lastUpdated || json.data?.lastUpdated || '';
      const totalStudents = json.totalStudents !== undefined
        ? json.totalStudents
        : (Array.isArray(json.data?.students) ? json.data.students.length : undefined);
      const tahunPelajaran = json.tahunPelajaran || json.data?.madrasah?.tahunPelajaran || '';
      const madrasahName = json.madrasahName || json.data?.madrasah?.namaMadrasah || '';

      return {
        success: true,
        lastUpdated,
        totalStudents,
        tahunPelajaran,
        madrasahName,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  try {
    const v = await Promise.any(endpoints.map(fetchSingle));
    return v;
  } catch (e) {
    return null;
  }
}

/**
 * Check live MySQL database connection status and student count
 */
export async function fetchDatabaseHealth(): Promise<{
  connected: boolean;
  driver?: string;
  database?: string;
  user?: string;
  host?: string;
  studentsCount?: number;
  madrasahName?: string;
  error?: string | null;
}> {
  const cacheBuster = `t=${Date.now()}`;
  const endpoints = getCandidateEndpoints('status').map((url) => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${cacheBuster}`;
  });

  for (const url of endpoints) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const json = await res.json();
          if (json && typeof json === 'object') {
            return json;
          }
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
    }
  }

  return { connected: false, error: 'Tidak dapat menghubungi endpoint status database' };
}

export function getLiveStreamEndpoint(): string {
  const base = getAppBasePath();
  return `${base}api/live-stream`;
}
