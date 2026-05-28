/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { 
  Download, 
  Globe, 
  Zap, 
  History, 
  Shield, 
  Info, 
  Clipboard, 
  Trash2, 
  CheckCircle, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  HardDrive, 
  Cpu, 
  ArrowRight,
  ExternalLink,
  Cloud
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { ResolvedFile, DownloadStats, HistoryItem } from "./types";
import { translations } from "./languages";
import { ThreeDButton } from "./components/ThreeDButton";
import { NetworkStatsChart } from "./components/NetworkStatsChart";

export default function App() {
  // Localization States
  const [lang, setLang] = useState<"en" | "hi">("en"); // Default to English
  const t = translations[lang];

  // Core Downloader Input & Status States
  const [url, setUrl] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedFile, setResolvedFile] = useState<ResolvedFile | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Custom Tuning Configuration parameters
  const [accelerationMultiplier, setAccelerationMultiplier] = useState(3.5);
  const [telemetryInterval, setTelemetryInterval] = useState(300); // MS interval
  const [simulationParallelThreads, setSimulationParallelThreads] = useState(8);
  const [forceCorsSandbox, setForceCorsSandbox] = useState(true);

  // Cloudflare Deployment Guide Active Tab
  const [cfTab, setCfTab] = useState<"steps" | "worker">("steps");

  // Configuration Switches
  const [autoTrigger, setAutoTrigger] = useState(true);
  const [turboEngine, setTurboEngine] = useState(true);
  const [simulateBypass, setSimulateBypass] = useState(false);

  // Download Progress Engine
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const activeProcessRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Sample files for quick click testing
  const sampleFiles = [
    { name: "mine_craft_pe_3d_mod.apk", size: "128.4 MB", url: "https://www.mediafire.com/file/mcpe120mod3d/mine_craft_pe_3d_mod.apk/file" },
    { name: "gta_5_hindi_voiceover.rar", size: "348.9 MB", url: "https://www.mediafire.com/file/gta5hindi/gta_5_hindi_voiceover.rar/file" },
    { name: "bgmi_lag_fix_config_2026.zip", size: "12.5 MB", url: "https://www.mediafire.com/file/bgmilagfix/bgmi_lag_fix_config_2026.zip/file" }
  ];

  // Initialize and load historical registry
  useEffect(() => {
    const saved = localStorage.getItem("mediafire_download_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history registry");
      }
    }
  }, []);

  // Save history helper
  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items);
    localStorage.setItem("mediafire_download_history", JSON.stringify(items));
  };

  const clearHistory = () => {
    saveHistory([]);
    setSuccessMsg(lang === "hi" ? "इतिहास सफलतापूर्वक साफ हो गया!" : "Download logs feed cleared successfully!");
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Safe speed history builder
  const createSpeedSampleArray = () => {
    const points = [];
    for (let i = 10; i >= 1; i--) {
      points.push({
        time: `${i}s ago`,
        speed: 0
      });
    }
    return points;
  };

  // Paste Link helper
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.includes("mediafire.com")) {
        setUrl(text);
        setErrorMsg(null);
        setSuccessMsg(lang === "hi" ? "लिंक पेस्ट कर दिया गया है!" : "MediaFire link pasted from clipboard!");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setUrl(text);
        setErrorMsg(lang === "hi" ? "यह एक वैध मीडियाफ़ायर लिंक नहीं दिख रहा है!" : "This does not seem to contain a mediafire link!");
        setTimeout(() => setErrorMsg(null), 4000);
      }
    } catch (err) {
      // Browser didn't support directly, just alert manually
      setErrorMsg(lang === "hi" ? "कृपया मैन्युअल रूप से लिंक पेस्ट करें!" : "Please paste the link manually into the input box!");
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Resolve API Link
  const handleResolve = async (customUrl?: string) => {
    const targetUrl = customUrl || url;
    if (!targetUrl) {
      setErrorMsg(lang === "hi" ? "कृपया एक वैध मीडियाफ़ायर लिंक दर्ज करें!" : "Please standardly input a MediaFire URL first!");
      return;
    }

    setIsResolving(true);
    setErrorMsg(null);
    setResolvedFile(null);
    setSuccessMsg(null);
    cancelCurrentActiveDownload();

    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: targetUrl,
          simulateOnly: simulateBypass,
          lang: lang
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || (lang === "hi" ? "सर्वर से संपर्क करने में समस्या आई।" : "Failed to establish bypass handshake with the backend parsing server."));
      }

      const fileData: ResolvedFile = await res.json();

      setResolvedFile(fileData);

      // Append record to local dashboard history
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        filename: fileData.filename,
        fileSize: fileData.fileSize,
        resolvedAt: new Date().toLocaleTimeString(),
        downloaded: false,
        url: targetUrl
      };

      const updatedHistory = [newHistoryItem, ...history.slice(0, 19)]; // limit to 20
      saveHistory(updatedHistory);

      setSuccessMsg(lang === "hi" ? "लिंक सफलतापूर्वक बाईपास हो गया!" : "MediaFire links decrypted successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);

      // Automatically trigger down flow if allowed
      if (autoTrigger) {
        setTimeout(() => {
          handleTriggerDownload(fileData);
        }, 800);
      }

    } catch (err: any) {
      setErrorMsg(err.message || "Failed to bypass. Please try again.");
    } finally {
      setIsResolving(false);
    }
  };

  // Programmatic high-accuracy stream downloader
  const handleTriggerDownload = async (file: ResolvedFile) => {
    if (activeProcessRef.current) return;
    
    // Create direct save triggered or progress loop
    setSuccessMsg(t.downloadStartSuccess);
    setTimeout(() => setSuccessMsg(null), 4000);

    // Cancel older
    cancelCurrentActiveDownload();

    // Prepare active states
    activeProcessRef.current = true;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Parse bytes weight
    let sizeBytes = 148500000; // default to 148MB
    const cleanSizeText = file.fileSize.toUpperCase();
    if (cleanSizeText.includes("MB")) {
      sizeBytes = parseFloat(cleanSizeText) * 1024 * 1024;
    } else if (cleanSizeText.includes("GB")) {
      sizeBytes = parseFloat(cleanSizeText) * 1024 * 1024 * 1024;
    } else if (cleanSizeText.includes("KB")) {
      sizeBytes = parseFloat(cleanSizeText) * 1024;
    }

    // Set initial progress stats
    const initialStats: DownloadStats = {
      progress: 0,
      bytesDownloaded: 0,
      totalBytes: sizeBytes,
      speed: 0,
      isFinished: false,
      isDownloading: true,
      isPaused: false,
      elapsedSeconds: 0,
      etaSeconds: 999,
      historyPoints: createSpeedSampleArray()
    };
    
    setStats(initialStats);

    const startTime = Date.now();
    let lastBytes = 0;
    let lastTime = startTime;
    let accumulatedBytes = 0;

    // We can fetch chunks directly from our simulated streaming endpoint to give a real-time speed chart experience,
    // OR if it's a real external file, we trigger a real file download in the browser.
    const isMockStreaming = file.directUrl.startsWith("/api/stream-download");

    if (isMockStreaming) {
      try {
        const response = await fetch(file.directUrl, {
          signal: controller.signal
        });

        if (!response.body) {
          throw new Error("No network body readable");
        }

        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          if (value) {
            accumulatedBytes += value.length;
            chunks.push(value);

            // Throttle state update using custom interval slider
            const now = Date.now();
            const timeDiff = now - lastTime;

            if (timeDiff >= telemetryInterval) { // custom parameter telemetry interval
              const byteDiff = accumulatedBytes - lastBytes;
              const speedMBs = (byteDiff / (1024 * 1024)) / (timeDiff / 1000);
              
              // Custom speed multiplier if Turbo Mode is enabled
              const finalSpeed = turboEngine ? speedMBs * accelerationMultiplier : speedMBs;
              const progressPercentage = Math.min((accumulatedBytes / sizeBytes) * 100, 99.8);
              const elapsed = Math.floor((now - startTime) / 1000);
              const remainingBytes = sizeBytes - accumulatedBytes;
              const eta = finalSpeed > 0 ? Math.ceil((remainingBytes / (1024 * 1024)) / finalSpeed) : 999;

              setStats(prev => {
                if (!prev) return null;
                const newHistory = [...prev.historyPoints.slice(1), { 
                  time: `${elapsed}s`, 
                  speed: finalSpeed 
                }];
                return {
                  ...prev,
                  progress: parseFloat(progressPercentage.toFixed(1)),
                  bytesDownloaded: accumulatedBytes,
                  speed: parseFloat(finalSpeed.toFixed(1)),
                  elapsedSeconds: elapsed,
                  etaSeconds: eta,
                  historyPoints: newHistory
                };
              });

              lastBytes = accumulatedBytes;
              lastTime = now;
            }
          }
        }

        // Finished Successfully
        const blob = new Blob(chunks, { type: "application/octet-stream" });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        triggerDownloadFinishComplete(file.filename);

      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Download aborted safely');
        } else {
          console.error("Stream downloading error:", err);
          fallbackToBrowserFlow(file);
        }
      }
    } else {
      // For real external URLs, we spawn an invisible file download trigger,
      // and animate the progress dashboard seamlessly so the user gets the best of both worlds.
      fallbackToBrowserFlow(file);
    }
  };

  const fallbackToBrowserFlow = (file: ResolvedFile) => {
    // 1. Spawns direct save trigger browser-side cleanly
    const a = document.createElement("a");
    a.href = file.directUrl;
    // Try to trigger direct download window safely
    a.target = "_blank";
    a.rel = "no-referrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 2. Animate progress bar elegantly to complete the visual dashboard experience
    let totalLoaded = 0;
    const cleanSizeText = file.fileSize.toUpperCase();
    let sizeBytes = 148500000;
    if (cleanSizeText.includes("MB")) sizeBytes = parseFloat(cleanSizeText) * 1024 * 1024;
    else if (cleanSizeText.includes("GB")) sizeBytes = parseFloat(cleanSizeText) * 1024 * 1024 * 1024;

    const interval = setInterval(() => {
      if (!activeProcessRef.current) {
        clearInterval(interval);
        return;
      }

      // Generate varying speed with acceleration multiplier
      const currentSpeed = (15 + Math.random() * 20) * (turboEngine ? accelerationMultiplier : 1.0);
      const increment = currentSpeed * 1024 * 1024 * (telemetryInterval / 1000); // adjust chunk scale with custom milliseconds
      totalLoaded += increment;

      if (totalLoaded >= sizeBytes) {
        clearInterval(interval);
        triggerDownloadFinishComplete(file.filename);
      } else {
        const progressPercentage = Math.min((totalLoaded / sizeBytes) * 100, 99.5);
        setStats(prev => {
          if (!prev) return null;
          const currentElapsed = prev.elapsedSeconds + 1;
          const remainingBytes = sizeBytes - totalLoaded;
          const eta = Math.ceil((remainingBytes / (1024 * 1024)) / currentSpeed);
          const newHistory = [...prev.historyPoints.slice(1), { 
            time: `${currentElapsed}s`, 
            speed: currentSpeed 
          }];
          return {
            ...prev,
            progress: parseFloat(progressPercentage.toFixed(1)),
            bytesDownloaded: totalLoaded,
            speed: parseFloat(currentSpeed.toFixed(1)),
            elapsedSeconds: currentElapsed,
            etaSeconds: eta,
            historyPoints: newHistory
          };
        });
      }
    }, telemetryInterval);
  };

  const triggerDownloadFinishComplete = (filename: string) => {
    setStats(prev => {
      if (!prev) return null;
      return {
        ...prev,
        progress: 100,
        isFinished: true,
        isDownloading: false,
        speed: 0
      };
    });
    activeProcessRef.current = false;

    // Update historical item status so it glows green in feed
    const updated = history.map(item => {
      if (item.filename === filename) return { ...item, downloaded: true };
      return item;
    });
    saveHistory(updated);

    // Clean active process
    abortControllerRef.current = null;
  };

  const cancelCurrentActiveDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    activeProcessRef.current = false;
    setStats(null);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col items-center justify-between font-sans selection:bg-cyan-500 selection:text-slate-900 relative overflow-x-hidden pb-6 md:pb-8">
      
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none select-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none select-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none select-none"></div>

      {/* Primary Header Segment - Frosted Glass Bar */}
      <header className="w-full border-b border-white/10 bg-white/5 backdrop-blur-md z-20 py-4.5 px-6 sticky top-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo with Frosted Glass Ring */}
            <div className="relative w-11 h-11 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] flex items-center justify-center border-t border-white/20">
              <Download className="w-5.5 h-5.5 text-white stroke-[2.5]" />
              <div className="absolute w-2 h-2 rounded-full bg-cyan-300 top-2 right-2 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                CLOUDSTREAM<span className="text-cyan-400 font-extrabold ml-1 font-mono">3D</span>
              </h1>
              <p className="text-[10px] text-slate-400 tracking-widest font-mono">AUTOMATED BYPASS FRAMEWORK</p>
            </div>
          </div>

          {/* Translation Trigger - Hinglish / Hindi Toggle Button */}
          <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-xl text-xs font-mono shadow-inner backdrop-blur-md">
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                lang === "en" 
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-md border-t border-white/25" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🇬🇧 EN
            </button>
            <button
              onClick={() => setLang("hi")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                lang === "hi" 
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-md border-t border-white/25" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🇮🇳 HI / Hinglish
            </button>
          </div>
        </div>
      </header>

      {/* Primary Application Interactive Layout */}
      <main className="w-full max-w-5xl px-6 flex-grow flex flex-col md:flex-row gap-8 pt-10 items-stretch z-10">
        
        {/* Left Side: Resolver Configuration & Action Core */}
        <section className="flex-1 flex flex-col gap-6 justify-start min-w-0">
          
          {/* Main Frosted Glass Paste Panel */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 relative overflow-hidden shadow-2xl">
            {/* Top Lightbar Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-600" />
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2 items-center">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <h2 className="text-sm font-bold text-slate-300 font-mono tracking-wide">{t.pasteLabel}</h2>
              </div>

            </div>

            <p className="text-xs text-slate-400 mb-6 font-medium leading-relaxed">
              {t.subtitle}
            </p>

            {/* Input Form Fields */}
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={t.placeholder}
                  className="w-full bg-slate-900/50 border-2 border-white/10 rounded-2xl p-4.5 pr-12 text-sm font-mono outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600 text-cyan-300"
                />
                
                {/* Easy Clear / Clipboard integration */}
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="absolute right-3.5 top-3.5 p-1.5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-cyan-400"
                  title="Paste link from clipboard"
                >
                  <Clipboard className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Action Resolution Panel with 3D buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <ThreeDButton
                  onClick={() => handleResolve()}
                  variant="cyan"
                  glowing
                  disabled={isResolving || !url}
                  className="flex-1"
                >
                  {isResolving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>{t.bypassing}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
                      <span>{t.bypassBtn}</span>
                    </>
                  )}
                </ThreeDButton>

                {/* Simulated force button */}
                <ThreeDButton
                  onClick={() => {
                    setSimulateBypass(true);
                    handleResolve(url || "https://www.mediafire.com/file/demo1234/premium_gta5_custom_installer.zip/file");
                  }}
                  variant="purple"
                  disabled={isResolving}
                  className="sm:px-4"
                >
                  <span>{lang === "hi" ? "सिमुलेशन फ़ोर्स" : "Force Simulation"}</span>
                </ThreeDButton>
              </div>
            </div>

            {/* Config & Toggles Area - Beautiful Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-8 border-t border-white/10 pt-6">
              
              <div 
                onClick={() => setAutoTrigger(!autoTrigger)}
                className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  autoTrigger 
                    ? "bg-cyan-500/10 border-cyan-500/40 shadow-inner" 
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-1 rounded-lg bg-white/5 text-cyan-400"><Download className="w-4 h-4" /></span>
                  <div className={`w-2.5 h-2.5 rounded-full ${autoTrigger ? "bg-cyan-400 animate-ping" : "bg-slate-600"}`} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{t.autoStart}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{t.autoStartDesc}</p>
                </div>
              </div>

              <div 
                onClick={() => setTurboEngine(!turboEngine)}
                className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  turboEngine 
                    ? "bg-emerald-550/10 border-emerald-500/40 shadow-inner" 
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-1 rounded-lg bg-white/5 text-emerald-400"><Cpu className="w-4 h-4" /></span>
                  <div className={`w-2.5 h-2.5 rounded-full ${turboEngine ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{t.speedMode}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{t.speedModeDesc}</p>
                </div>
              </div>

              <div 
                onClick={() => setSimulateBypass(!simulateBypass)}
                className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  simulateBypass 
                    ? "bg-purple-550/10 border-purple-500/40 shadow-inner" 
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-1 rounded-lg bg-white/5 text-purple-400"><HardDrive className="w-4 h-4" /></span>
                  <div className={`w-2.5 h-2.5 rounded-full ${simulateBypass ? "bg-purple-400 animate-ping" : "bg-slate-600"}`} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{t.demoMode}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{t.demoModeDesc}</p>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Preset Sandbox - click triggers immediate loading */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg">
            <h3 className="text-xs font-mono font-bold text-slate-300 mb-3 tracking-wide uppercase flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              {lang === "hi" ? "त्वरित परीक्षण प्रीमियम बेंचमार्क" : "Instant Sandbox Benchmarks"}
            </h3>
            <div className="flex flex-col gap-2">
              {sampleFiles.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setUrl(item.url);
                    handleResolve(item.url);
                  }}
                  className="w-full flex items-center justify-between bg-slate-950/40 hover:bg-slate-900/40 border border-white/5 hover:border-white/10 p-2.5 rounded-xl transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-cyan-400 w-5">0{idx + 1}</span>
                    <span className="text-xs font-bold text-slate-300 group-hover:text-cyan-350 transition-colors line-clamp-1">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500 bg-black/20 px-2 py-0.5 rounded-md border border-white/5">{item.size}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors group-hover:translate-x-0.5 duration-150" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Performance & Simulator Settings Tuning */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-3">
              <Cpu className="w-4 h-4 text-emerald-400" />
              {lang === "hi" ? "एडवांस्ड ट्यूनिंग और परफॉरमेंस सेटिंग" : "Advanced System Performance Tuning"}
            </h3>

            {/* Slider 1: Speed Acceleration Scale */}
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <span>⚡ ACCELERATION MULTIPLIER:</span>
                <span className="text-emerald-400 font-bold">{accelerationMultiplier.toFixed(1)}x Speed</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="0.5"
                value={accelerationMultiplier}
                onChange={(e) => setAccelerationMultiplier(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Slider 2: Telemetry Interval Updates */}
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <span>⏱️ TELEMETRY PULSE REFRESH:</span>
                <span className="text-cyan-400 font-bold">{telemetryInterval} ms</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={telemetryInterval}
                onChange={(e) => setTelemetryInterval(parseInt(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Selector 3: Parallel Virtual Stream Threads */}
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <span>🗂️ SIMULATOR PARALLEL THREADS:</span>
                <span className="text-purple-400 font-bold">{simulationParallelThreads} Workers</span>
              </div>
              <input
                type="range"
                min="2"
                max="32"
                step="2"
                value={simulationParallelThreads}
                onChange={(e) => setSimulationParallelThreads(parseInt(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* CORS Switcher */}
            <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-2">
              <div>
                <span className="text-[11px] font-mono font-bold text-slate-300 block">FORCE EDGE CORS RUNTIME</span>
                <span className="text-[9px] text-slate-500">Prevent origin blocks at sandboxed nodes</span>
              </div>
              <button
                type="button"
                onClick={() => setForceCorsSandbox(!forceCorsSandbox)}
                className={`w-11 h-6 rounded-full p-1 transition-all ${forceCorsSandbox ? "bg-cyan-500" : "bg-slate-700"}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all ${forceCorsSandbox ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>

        </section>

        {/* Right Side: Resolved Results, Stats Dashboard & Histroy Feed */}
        <section className="flex-1 flex flex-col gap-6 justify-start min-w-0">
          
          {/* Success / Error notification bar */}
          <AnimatePresence mode="popLayout">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-rose-950/35 border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3 shadow-md backdrop-blur-md"
              >
                <div className="p-1 rounded-lg bg-rose-500/10 text-rose-400 shrink-0"><AlertCircle className="w-5 h-5" /></div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wide">{t.errorPre}</h4>
                  <p className="text-xs text-rose-200 mt-0.5 leading-relaxed font-semibold">{errorMsg}</p>
                </div>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-emerald-950/30 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3 shadow-md backdrop-blur-md"
              >
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0"><CheckCircle className="w-5 h-5 animate-bounce" /></div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide">SUCCESS ACTIVE</h4>
                  <p className="text-xs text-emerald-200 mt-0.5 leading-relaxed font-semibold">{successMsg}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resolved File Details Display Card */}
          {resolvedFile && (
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 relative overflow-hidden shadow-2xl">
              {/* Highlight badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-500 to-blue-600 text-white font-bold font-mono text-[9px] tracking-widest px-4 py-1.5 uppercase rounded-bl-xl shadow-md border-b border-l border-white/10">
                BYPASSED & REGISTERED
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-white/5 text-cyan-400 flex items-center justify-center border border-white/10">
                  <Download className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">FILE DECRYPTED</h3>
              </div>

              {/* Grid with properties */}
              <div className="space-y-4">
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-mono font-bold text-slate-500 block mb-1 uppercase tracking-wide">FILE IDENTIFIER</span>
                  <span className="text-xs font-black text-cyan-300 font-mono break-all line-clamp-2">{resolvedFile.filename}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-mono font-semibold text-slate-500 block mb-0.5 uppercase">{t.fileSizeLabel}</span>
                    <span className="text-xs font-bold text-slate-200">{resolvedFile.fileSize}</span>
                  </div>
                  <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-mono font-semibold text-slate-500 block mb-0.5 uppercase">ROUTING STATUS</span>
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                      SECURE BYPASS
                    </span>
                  </div>
                </div>

                {resolvedFile.message && (
                  <div className="text-[10px] font-mono text-amber-350/85 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
                    ⚡ {resolvedFile.message}
                  </div>
                )}

                {/* Primary Trigger download bar */}
                <div className="flex gap-2.5 pt-2">
                  <ThreeDButton
                    onClick={() => handleTriggerDownload(resolvedFile)}
                    variant="green"
                    glowing
                    disabled={stats?.isDownloading}
                    className="flex-1"
                  >
                    <Download className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
                    <span>{lang === "hi" ? "डाउनलोड शुरू करें" : "Initiate Direct Download"}</span>
                  </ThreeDButton>

                  <a
                    href={resolvedFile.directUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/10 flex items-center justify-center transition-all shadow-inner"
                    title="Open Direct Link in New Tab"
                  >
                    <ExternalLink className="w-4.5 h-4.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Active Downloader Telemetry Panel */}
          {stats && (
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-5 relative overflow-hidden shadow-2xl">
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-mono font-black text-cyan-400 tracking-widest uppercase flex items-center gap-2">
                  <Cpu className="w-4.5 h-4.5 animate-pulse text-cyan-400" />
                  {t.statsTitle}
                </h3>
                <button
                  onClick={cancelCurrentActiveDownload}
                  className="text-[10px] font-mono font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20 transition-all uppercase"
                >
                  {stats.isFinished ? "Close Panel" : "Abort Link"}
                </button>
              </div>

              {/* Progress visual section */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wide uppercase">ACCELERATION PERCENTAGE</span>
                  <span className="text-sm font-black font-mono text-cyan-400">{stats.progress}%</span>
                </div>

                {/* Progress bar container */}
                <div className="w-full bg-slate-900 rounded-full h-3.5 border border-white/5 p-0.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    style={{ width: `${stats.progress}%` }}
                  />
                </div>

                {/* Counter blocks */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-mono text-slate-400">
                  <div className="bg-slate-900/50 p-2 rounded-xl border border-white/5">
                    <span className="text-[9px] text-slate-500 block mb-0.5 uppercase">TRANSFERRED STREAMS</span>
                    <span className="font-bold text-slate-300">{formatBytes(stats.bytesDownloaded)} / {formatBytes(stats.totalBytes)}</span>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-xl border border-white/5">
                    <span className="text-[9px] text-slate-500 block mb-0.5 uppercase">{t.remTime}</span>
                    <span className="font-bold text-amber-400">
                      {stats.isFinished 
                        ? (lang === "hi" ? "पूरा हुआ" : "DONE") 
                        : `${stats.etaSeconds} Sec`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Network Stats Chart Integration */}
              <NetworkStatsChart data={stats.historyPoints} color={turboEngine ? "#10b981" : "#06b6d4"} />

            </div>
          )}

          {/* Decrypted History Registries Log */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-mono font-black text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
                <History className="w-4 h-4 text-cyan-400" />
                {t.historyTitle}
              </h3>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[10px] font-mono text-slate-405 hover:text-rose-400 transition-all flex items-center gap-1 uppercase"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t.clearHistory}
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="bg-white/5 border border-white/5 border-dashed rounded-xl p-8 text-center text-xs text-slate-500 font-mono">
                No past transactions recorded. Links decrypted here will be saved locally.
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950/40 border border-white/5 hover:border-white/10 p-3 rounded-xl flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.downloaded ? "bg-emerald-400" : "bg-cyan-400 animate-pulse"}`} />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-300 truncate font-mono line-clamp-1">{item.filename}</h4>
                        <span className="text-[9px] font-mono text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{item.fileSize}</span>
                          <span>•</span>
                          <span>{item.resolvedAt}</span>
                        </span>
                      </div>
                    </div>
                    
                    {/* Instant re-resolve controller */}
                    <button
                      onClick={() => {
                        setUrl(item.url);
                        handleResolve(item.url);
                      }}
                      className="text-[10px] font-mono font-bold text-cyan-455 hover:text-cyan-350 bg-cyan-500/10 px-2 py-1.5 rounded-lg border border-cyan-500/20 transition-all uppercase shrink-0"
                    >
                      Bypass
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </section>

      </main>

      {/* Information Core Accordion describing how link resolution logic bypasses restrictions */}
      <section className="w-full max-w-5xl px-6 mt-10 z-10">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <h3 className="text-xs font-mono font-bold text-slate-300 mb-4 tracking-wide flex items-center gap-1.5">
            <Info className="w-4 h-4 text-cyan-400" />
            {t.howItWorks}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-400 leading-relaxed font-medium">
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
              <span className="text-[10px] font-mono font-bold text-cyan-400 block mb-1">STEP 01</span>
              <p>{t.howItWorks1}</p>
            </div>
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
              <span className="text-[10px] font-mono font-bold text-indigo-400 block mb-1">STEP 02</span>
              <p>{t.howItWorks2}</p>
            </div>
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
              <span className="text-[10px] font-mono font-bold text-purple-400 block mb-1">STEP 03</span>
              <p>{t.howItWorks3}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cloudflare Interactive Deployment Center */}
      <section className="w-full max-w-5xl px-6 mt-6 z-10">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/15 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/30">
                <Cloud className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200 tracking-wide font-mono uppercase">
                  {lang === "hi" ? "क्लाउडफ्लेर होस्टिंग गाइड" : "Cloudflare Deployment Hub"}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Host this framework completely free at the edge</p>
              </div>
            </div>

            {/* Hub tabs */}
            <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/5 text-[10px] font-mono">
              <button
                onClick={() => setCfTab("steps")}
                className={`px-3 py-1.5 rounded-lg transition-all ${cfTab === "steps" ? "bg-orange-500/20 text-orange-350 font-bold border border-orange-500/30" : "text-slate-500 hover:text-slate-350"}`}
              >
                {lang === "hi" ? "होस्टिंग चरण" : "Deployment Steps"}
              </button>
              <button
                onClick={() => setCfTab("worker")}
                className={`px-3 py-1.5 rounded-lg transition-all ${cfTab === "worker" ? "bg-orange-500/20 text-orange-350 font-bold border border-orange-500/30" : "text-slate-500 hover:text-slate-350"}`}
              >
                {lang === "hi" ? "वर्कर्स API कोड" : "Workers API (Backend Code)"}
              </button>
            </div>
          </div>

          {cfTab === "steps" ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                {lang === "hi" 
                  ? "इस पूरी वेबसाइट को बिना ₹1 खर्च किए क्लाउडफ्लेयर पर होस्ट किया जा सकता है। नीचे दिए गए स्टेप्स का पालन करें:"
                  : "You can host this entire interactive bypass hub on Cloudflare’s global edge network instantly. Follow the precise walkthrough:"
                }
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl flex gap-3">
                  <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">1</span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5 flex-wrap">
                      <span>Frontend: Cloudflare Pages</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono rounded">Wrangler CLI Guide</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono rounded">Avoid node_modules!</span>
                    </h4>
                    <p className="text-[11px] text-slate-405 leading-relaxed whitespace-pre-line">
                      {lang === "hi"
                        ? "⚠️ महत्वपूर्ण: यदि आप डायरेक्ट अपलोड (Drag & Drop) कर रहे हैं, तो केवल 'dist' फोल्डर अपलोड करें। पूरी रिपोजिटरी को या 'node_modules' को ना खींचें (इससे 1000+ फ़ाइलों की त्रुटि आएगी)!\n\n1. अपने कंप्यूटर पर पहले `npm install` चलाएं (यदि 'vite is not recognized' एरर आए).\n2. इसके बाद `npm run build` चलाकर केवल `dist` फोल्डर तैयार करें।\n3. डैशबोर्ड पर केवल और केवल `dist` फोल्डर को ही ड्रैग एवं ड्रॉप करें, या फिर Wrangler CLI से 1 सेकंड में होस्ट करें:\n   `npx wrangler pages deploy dist`"
                        : "⚠️ CRITICAL: If you use drag-and-drop, ONLY upload the compiled 'dist' folder! Never drag the whole project directory (which has 20,000+ files in node_modules, causing the 1000-file upload limit error).\n\n1. Run `npm install` in your local directory first if you get a ''vite' is not recognized' command error.\n2. Run `npm run build` to generate the compiled files in the 'dist/' folder.\n3. Drag and drop ONLY the newly created 'dist/' folder into Cloudflare, or use the Wrangler CLI command:\n   `npx wrangler pages deploy dist`"
                      }
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl flex gap-3">
                  <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">2</span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-200 mb-1">Backend Handler: Cloudflare Workers</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-line">
                      {lang === "hi"
                        ? "1. 'Workers API' टैब से हमारा एज-ऑप्टिमाइज्ड स्क्रिप्ट कॉपी करें।\n2. 'api-worker.js' नाम की फाइल बनाएं और इसे Wrangler के जरिए या सीधे Cloudflare डैशबोर्ड पर नया Worker क्रिएट करके होस्ट करें ताकि रिमोट बाईपास कॉल्स को स्मूथली रूट किया जा सके।"
                        : "1. Head to the 'Workers API' tab above and copy our lightweight proxy handler.\n2. Write it into a Worker file or paste it directly in the Workers online code editor to establish a blazing-fast server-authoritative bypass relay."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                {lang === "hi"
                  ? "इस कोड को अपने Cloudflare Worker में पेस्ट करें। यह बिना किसी ओरिजिन रीस्ट्रिक्शन के सीधे मीडियाफायर से बाइपास डाटा लाएगा:"
                  : "Paste this production-ready script into your Cloudflare Workers Dashboard. It leverages the edge runtime to handle high-performance direct URL decryptions:"
                }
              </p>

              {/* Code Snippet Card */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/5">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">cloudflare-worker.js</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    if (url.pathname === "/api/resolve") {
      try {
        const { url: targetUrl } = await request.json();
        const response = await fetch(targetUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        const html = await response.text();
        const regex = /href="https?:\\/\\/download\\d+\\.mediafire\\.com\\/[^"]+"/i;
        const match = html.match(regex);
        if (match) {
          const directLink = match[0].substring(6, match[0].length - 1);
          return new Response(JSON.stringify({
            filename: "Decrypted File Archive",
            fileSize: "Bypassed on Cloudflare Core",
            directUrl: directLink
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        throw new Error("Download link pattern not found on webpage.");
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }
    return new Response("CloudStream is Live!", { headers: corsHeaders });
  }
};`);
                      setSuccessMsg(lang === "hi" ? "कोड क्लिपबोर्ड पर कॉपी हो गया!" : "Worker script copied to clipboard!");
                      setTimeout(() => setSuccessMsg(null), 3500);
                    }}
                    className="text-[10px] font-mono text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1.5"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    Copy Code
                  </button>
                </div>
                <pre className="p-4 text-[11px] font-mono text-orange-200/80 overflow-x-auto select-all max-h-56 leading-relaxed">
{`export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    if (url.pathname === "/api/resolve") {
      try {
        const { url: targetUrl } = await request.json();
        const response = await fetch(targetUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        const html = await response.text();
        const regex = /href="https?:\\/\\/download\\d+\\.mediafire\\.com\\/[^"]+"/i;
        const match = html.match(regex);
        if (match) {
          const directLink = match[0].substring(6, match[0].length - 1);
          return new Response(JSON.stringify({
            filename: "Decrypted File Archive",
            fileSize: "Bypassed on Cloudflare Core",
            directUrl: directLink
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        throw new Error("Download link pattern not found on webpage.");
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }
    return new Response("CloudStream is Live!", { headers: corsHeaders });
  }
};`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer Branding Area */}
      <footer className="w-full max-w-5xl px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-5 border-t border-white/10 mt-12 md:mt-14 text-[11px] text-slate-500 z-10">
        <div className="flex flex-col gap-1.5 items-center sm:items-start text-center sm:text-left">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span className="font-mono font-bold text-slate-400 tracking-wider text-[9px] uppercase">
              {lang === "hi" ? "क्लाउडस्ट्रीम इंजन ऑनलाइन • v2.8" : "CLOUDSTREAM ACTIVE BACKEND ENGINE v2.8"}
            </span>
          </div>
          <p className="max-w-md text-[10px] sm:text-[11px] text-slate-500 leading-relaxed font-sans">
            {lang === "hi" 
              ? "यह युटिलिटी केवल व्यक्तिगत बैकअप और शिक्षा रिसर्च के लिए है। हम बौद्धिक संपदा अधिकारों का पूर्ण सम्मान करते हैं। सर्वर पर कोई फाइल स्टोर नहीं होती।" 
              : "This sandbox utility is designed strictly for personal backups, testing, and educational flow analysis. We fully respect fair use policies and do not store files on our proxy nodes."}
          </p>
        </div>

        <div className="flex flex-col items-center sm:items-end gap-1.5 text-center sm:text-right font-mono text-[10px]">
          <div className="flex items-center gap-1 text-slate-400 font-semibold">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {lang === "hi" 
                ? "सिक्योर सर्वर-मजबूत डिक्रिप्शन" 
                : "Secured & Sanitized Bypass Nodes"}
            </span>
          </div>
          <div className="flex gap-2.5 text-slate-600 text-[9px]">
            <span>© {new Date().getFullYear()} CloudStream Core</span>
            <span>•</span>
            <span>{lang === "hi" ? "सुरक्षित एवं अनाम" : "Encrypted Transit"}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
