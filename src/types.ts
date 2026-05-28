export interface ResolvedFile {
  filename: string;
  fileSize: string;
  directUrl: string;
  resolvedAt: string;
  sourceUrl: string;
  isSimulated: boolean;
  message?: string;
}

export interface DownloadStats {
  progress: number; // 0 to 100
  bytesDownloaded: number;
  totalBytes: number;
  speed: number; // in MB/s
  isFinished: boolean;
  isDownloading: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  etaSeconds: number;
  historyPoints: Array<{ time: string; speed: number }>;
}

export interface HistoryItem {
  id: string;
  filename: string;
  fileSize: string;
  resolvedAt: string;
  downloaded: boolean;
  url: string;
}

export interface LanguageTemplate {
  title: string;
  subtitle: string;
  pasteLabel: string;
  placeholder: string;
  bypassBtn: string;
  bypassing: string;
  speedMode: string;
  speedModeDesc: string;
  instantDown: string;
  instantDownDesc: string;
  autoStart: string;
  autoStartDesc: string;
  statsTitle: string;
  historyTitle: string;
  clearHistory: string;
  realtimeSpeed: string;
  remTime: string;
  elapsed: string;
  fileSizeLabel: string;
  closeBtn: string;
  downloadStartSuccess: string;
  errorPre: string;
  howItWorks: string;
  howItWorks1: string;
  howItWorks2: string;
  howItWorks3: string;
  demoMode: string;
  demoModeDesc: string;
  simulateBtn: string;
}
