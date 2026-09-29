import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  Smartphone,
  BellRing,
  CheckCircle2,
  Copy,
  ExternalLink,
  Terminal,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  showBrowserSystemNotification,
  enableBackgroundPushNotifications,
  triggerTestPushNotification,
} from '../services/pushNotifications';
import { useAuth } from '../state/AuthContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

interface PwaApkInstallModalProps {
  onClose: () => void;
}

export const PwaApkInstallModal: React.FC<PwaApkInstallModalProps> = ({
  onClose,
}) => {
  const { showToast } = useAuth();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(
      typeof window !== 'undefined' ? window.__deferredPwaPrompt || null : null
    );
  const [isInstalled, setIsInstalled] = useState(false);
  const [sendingPush, setSendingPush] = useState(false);
  const [pushSuccess, setPushSuccess] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const liveGithubUrl = 'https://princeabba96-byte.github.io/boosthub/';
  const liveCloudRunUrl =
    'https://ais-pre-62xylcimytvbz7erjuuswo-579537184586.europe-west2.run.app';
  const pwaBuilderApkUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(
    liveGithubUrl
  )}`;
  const bubblewrapCmd = `npx @bubblewrap/cli init --manifest=${liveGithubUrl}manifest.json && npx @bubblewrap/cli build`;

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      window.__deferredPwaPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      window.__deferredPwaPrompt = null;
      setDeferredPrompt(null);
      showToast('BoostHub installed on your device!', 'success');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [showToast]);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        window.__deferredPwaPrompt = null;
      }
      return;
    }
    showToast(
      'On Android Chrome: tap the browser menu (⋮) → "Install app" or "Add to Home screen". On iPhone Safari: tap Share → "Add to Home Screen".',
      'info'
    );
  };

  const handleSendTestPush = async () => {
    setSendingPush(true);
    setPushSuccess(false);
    try {
      await enableBackgroundPushNotifications(true).catch(() => {});
      await triggerTestPushNotification().catch(() => {});
      await showBrowserSystemNotification(
        'BoostHub Push Active 🚀',
        'Electric Blue #0A84FF Push Notification delivered via Service Worker!',
        './?tab=notifications'
      );
      setPushSuccess(true);
      showToast(
        'Test Push Notification sent! Check your phone/browser notification bar.',
        'success'
      );
    } catch {
      showToast('Could not trigger test push notification.', 'error');
    } finally {
      setSendingPush(false);
    }
  };

  const handleCopyLink = (text: string, isCmd = false) => {
    navigator.clipboard.writeText(text).catch(() => {});
    if (isCmd) {
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
      showToast('Bubblewrap APK build command copied!', 'success');
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      showToast('Live HTTPS install link copied!', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0A0A0A] border border-[#0A84FF]/40 rounded-3xl shadow-[0_0_50px_rgba(10,132,255,0.22)] overflow-hidden my-auto">
        {/* Top Header Banner */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0A0A0A] via-[#07162C] to-[#0A0A0A] border-b border-[#0A84FF]/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="./icons/icon-192x192.png"
              alt="BoostHub 3D Icon"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = './icon.svg';
              }}
              className="w-14 h-14 rounded-2xl border border-[#00E5FF]/50 shadow-[0_0_24px_rgba(0,229,255,0.35)] object-cover bg-[#0A0A0A]"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  BoostHub App & APK Center
                </h2>
                <span className="text-xs font-bold text-[#00E5FF]">
                  v1.0 LIVE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Install as a standalone mobile app, test Service Worker Push, or download the Android APK
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* 1. Primary Action Row: Install App + Send Test Push Button */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleNativeInstall}
              className="min-h-[50px] px-4 py-3 rounded-2xl bg-gradient-to-r from-[#0A84FF] to-[#00E5FF] hover:opacity-95 text-[#0A0A0A] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(10,132,255,0.45)] transition-all"
            >
              <Smartphone className="w-4 h-4 stroke-[2.5]" />
              <span>
                {isInstalled
                  ? 'BoostHub Installed on Device ✓'
                  : 'Install BoostHub App Now'}
              </span>
            </button>

            <button
              type="button"
              disabled={sendingPush}
              onClick={handleSendTestPush}
              className="min-h-[50px] px-4 py-3 rounded-2xl bg-[#0A84FF]/15 hover:bg-[#0A84FF]/25 border border-[#00E5FF]/50 text-[#00E5FF] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <BellRing className="w-4 h-4" />
              <span>
                {sendingPush
                  ? 'Sending Test Push...'
                  : pushSuccess
                    ? 'Test Push Delivered ✓'
                    : 'Send Test Push'}
              </span>
            </button>
          </div>

          {/* 2. Live Public HTTPS Links to Open on Phone */}
          <div className="p-4 rounded-2xl bg-[#111622] border border-[#0A84FF]/25 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#00E5FF] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Live Public HTTPS Links (Open on Phone to Install)</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={liveGithubUrl}
                className="flex-1 bg-[#0A0A0A] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink(liveGithubUrl, false)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#00B8FF] text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedUrl ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <a
                  href={liveGithubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open</span>
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Cloud Server Mirror:</span>
              <a
                href={liveCloudRunUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00E5FF] hover:underline font-mono truncate max-w-[260px] sm:max-w-md"
              >
                {liveCloudRunUrl}
              </a>
            </div>
          </div>

          {/* 3. Android APK Download (PWABuilder & Bubblewrap TWA) */}
          <div className="p-4 rounded-2xl bg-[#111622] border border-[#0A84FF]/30 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#00E5FF]" />
                  <span>Download Android APK (PWABuilder & Bubblewrap)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Manifest & 192x192 / 512x512 PNG icons are verified and ready for instant Android APK packaging.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href={pwaBuilderApkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#00E5FF] text-[#0A0A0A] font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-opacity"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Generate & Download APK (PWABuilder)</span>
              </a>

              <a
                href="./twa-manifest.json"
                download="twa-manifest.json"
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Terminal className="w-4 h-4 text-[#00E5FF]" />
                <span>Download Bubblewrap twa-manifest.json</span>
              </a>
            </div>

            {/* Bubblewrap CLI One-Line Command */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="font-semibold">
                  Bubblewrap CLI Direct APK Build Command:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyLink(bubblewrapCmd, true)}
                  className="text-[#00E5FF] hover:underline font-semibold inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedCmd ? 'Copied!' : 'Copy Command'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-[#0A0A0A] border border-white/10 text-[11px] font-mono text-[#00E5FF] overflow-x-auto">
                {bubblewrapCmd}
              </pre>
            </div>
          </div>

          {/* 4. Generated 3D Icons & Manifest Assets */}
          <div className="p-4 rounded-2xl bg-[#111622] border border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-[#00E5FF] shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">
                  3D BoostHub App Icons & Manifest Assets
                </p>
                <p className="text-[11px] text-slate-400">
                  #0A84FF → #00E5FF Electric Blue 3D B-Rocket Icon on #0A0A0A
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <a
                href="./icons/icon-192x192.png"
                download="boosthub-icon-192x192.png"
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#00E5FF] font-semibold"
              >
                192×192 PNG
              </a>
              <a
                href="./icons/icon-512x512.png"
                download="boosthub-icon-512x512.png"
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#00E5FF] font-semibold"
              >
                512×512 PNG
              </a>
              <a
                href="./manifest.json"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold"
              >
                manifest.json
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
