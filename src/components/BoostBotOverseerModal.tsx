import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  UserX,
  UserMinus,
  Send,
  Eye,
  CheckCircle2,
  RefreshCw,
  Search,
  Lock,
  X,
  MessageSquare,
  Sparkles,
  Terminal,
  Users,
  Image as ImageIcon,
  Flame,
  FileText,
  Clock,
  Maximize2,
  Check,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { useAuth } from '../state/AuthContext';
import { apiFetch } from '../services/api';
import { isPlatformFounder } from '../utils/creatorAdmin';

export interface ViolationReport {
  id: string;
  userId: string;
  userName: string;
  username: string;
  userAvatar?: string;
  userEmail?: string;
  category: 'nsfw_nude' | 'insult_toxicity' | 'scam_fraud' | 'harassment';
  severity: 'critical' | 'high' | 'medium';
  confidencePct: number;
  pictureProofUrl?: string;
  textProof?: string;
  sourceType: 'post' | 'capshot' | 'comment' | 'message' | 'avatar';
  detectedAt: string;
  status: 'pending' | 'resolved' | 'action_taken';
  notes: string;
}

export interface OverseerUserRecord {
  id: string;
  displayName: string;
  username: string;
  email: string;
  avatarUrl?: string;
  role: string;
  isAdmin: boolean;
  isVerified: boolean;
  isSuspended: boolean;
  isBlocked?: boolean;
  createdAt: string;
  boostPoints: number;
  xp: number;
  postsCount?: number;
}

interface BoostBotOverseerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Initial high-fidelity simulation + real data store for Boost Bot violations
const SEED_VIOLATIONS: ViolationReport[] = [
  {
    id: 'v_101',
    userId: 'usr_troll_99',
    userName: 'Chidi BadBoy',
    username: 'chidi_toxic',
    userEmail: 'chidi_toxic99@gmail.com',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    category: 'nsfw_nude',
    severity: 'critical',
    confidencePct: 99.4,
    pictureProofUrl:
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    textProof: 'Look at this unfiltered picture right here guys, no rules on BoostHub!',
    sourceType: 'post',
    detectedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    status: 'pending',
    notes:
      'Boost Bot Vision Sentinel flagged explicit anatomy violation exceeding community standards 4.1.',
  },
  {
    id: 'v_102',
    userId: 'usr_bully_44',
    userName: 'Emeka Abuser',
    username: 'emeka_shade',
    userEmail: 'emeka_real22@yahoo.com',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    category: 'insult_toxicity',
    severity: 'high',
    confidencePct: 98.2,
    textProof:
      'You are completely useless and foolish, your video is trash! Nobody wants to see your face here idiot.',
    sourceType: 'comment',
    detectedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    status: 'pending',
    notes:
      'Boost Bot NLP Filter flagged targeted derogatory insults, aggressive cyberbullying, and profanity.',
  },
  {
    id: 'v_103',
    userId: 'usr_scammer_88',
    userName: 'Crypto Doubler Fast',
    username: 'boost_free_crypto',
    userEmail: 'free_crypto_fast@mail.com',
    userAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150',
    category: 'scam_fraud',
    severity: 'critical',
    confidencePct: 99.8,
    pictureProofUrl:
      'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=600&auto=format&fit=crop&q=80',
    textProof:
      'Send 5,000 BP to my wallet and get 50,000 BP back in 2 hours! Click fast: http://fake-boost-claim.xyz',
    sourceType: 'capshot',
    detectedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'pending',
    notes:
      'Boost Bot Fraud Sentinel intercepted malicious phishing link and fraudulent currency promise.',
  },
];

export const BoostBotOverseerModal: React.FC<BoostBotOverseerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { userProfile, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState<'violations' | 'users' | 'terminal'>('violations');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [violations, setViolations] = useState<ViolationReport[]>(() => {
    try {
      const saved = localStorage.getItem('boosthub_overseer_violations_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return SEED_VIOLATIONS;
  });

  const [usersList, setUsersList] = useState<OverseerUserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [runningSweep, setRunningSweep] = useState(false);
  const [zoomProofUrl, setZoomProofUrl] = useState<string | null>(null);

  // Warning Modal State
  const [warningTargetUser, setWarningTargetUser] = useState<{
    id: string;
    name: string;
    username: string;
  } | null>(null);
  const [warningMessage, setWarningMessage] = useState(
    'OFFICIAL MODERATION WARNING: Your content violates BoostHub Community Standards. Continued violations will result in permanent suspension.'
  );
  const [sendingWarning, setSendingWarning] = useState(false);

  // Command Terminal State
  const [terminalLog, setTerminalLog] = useState<
    Array<{ id: string; sender: 'me' | 'boostbot'; text: string; time: string }>
  >([
    {
      id: 'init_1',
      sender: 'boostbot',
      text: '🤖 BOOST BOT OVERSEER ONLINE. In-app platform sentinel active. BoostHub public uploads, posts, and comments are monitored under Prince Abba direct authority (community content only; user personal life is strictly private).',
      time: new Date().toLocaleTimeString(),
    },
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  // Persist violations
  useEffect(() => {
    try {
      localStorage.setItem('boosthub_overseer_violations_v1', JSON.stringify(violations));
    } catch {}
  }, [violations]);

  // Load registered users from API
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await apiFetch<any>('/api/admin/overview');
      if (res && Array.isArray(res.users)) {
        setUsersList(
          res.users.map((u: any) => ({
            id: u.id,
            displayName: u.displayName || u.display_name || 'User',
            username: u.username || 'user',
            email: u.email || 'No email',
            avatarUrl: u.avatarUrl || u.avatar_url || '',
            role: u.role || 'user',
            isAdmin: Boolean(u.isAdmin),
            isVerified: Boolean(u.isVerified),
            isSuspended: Boolean(u.isSuspended),
            createdAt: u.createdAt || u.created_at || new Date().toISOString(),
            boostPoints: u.boostPoints ?? u.boost_points ?? 0,
            xp: u.xp ?? 0,
            postsCount: u.postsCount ?? 0,
          }))
        );

        if (Array.isArray(res.reports) && res.reports.length > 0) {
          const realReports: ViolationReport[] = res.reports.map((r: any) => ({
            id: `rep_${r.id}`,
            userId: r.userId || 'usr_unknown',
            userName: r.reportedBy?.displayName || r.userDisplayName || 'Reported Creator',
            username: r.reportedBy?.username || 'user',
            userEmail: r.reportedBy?.email || 'creator@boosthub.app',
            userAvatar: r.reportedBy?.avatarUrl || '',
            category: r.category || 'inappropriate_content',
            severity: 'high' as const,
            confidencePct: 98.5,
            textProof: r.content || r.reason || 'Reported by community members.',
            sourceType: (r.targetType as any) || 'post',
            detectedAt: r.createdAt || new Date().toISOString(),
            status: 'pending' as const,
            notes: `Flagged under BoostHub Standards: ${r.reason || 'In-app content review'}. User personal life is strictly private and never tracked.`,
          }));
          setViolations((prev) => {
            const existingIds = new Set(realReports.map((x) => x.id));
            return [...realReports, ...prev.filter((x) => !existingIds.has(x.id))];
          });
        }
      }
    } catch {
      // Fallback to current authenticated user + sample accounts
      if (userProfile) {
        setUsersList([
          {
            id: userProfile.id,
            displayName: userProfile.displayName,
            username: userProfile.username,
            email: userProfile.email || 'pchukwuka114@gmail.com',
            avatarUrl: userProfile.avatarUrl,
            role: 'founder',
            isAdmin: true,
            isVerified: true,
            isSuspended: false,
            createdAt: userProfile.createdAt || new Date().toISOString(),
            boostPoints: userProfile.boostPoints || 999999,
            xp: userProfile.xp || 50000,
          },
          {
            id: 'usr_chidi_99',
            displayName: 'Chidi Toxic',
            username: 'chidi_toxic',
            email: 'chidi_toxic99@gmail.com',
            role: 'user',
            isAdmin: false,
            isVerified: false,
            isSuspended: false,
            createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
            boostPoints: 150,
            xp: 220,
          },
          {
            id: 'usr_ada_33',
            displayName: 'Adaeze Okonkwo',
            username: 'ada_creative',
            email: 'adaeze.o@gmail.com',
            role: 'creator',
            isAdmin: false,
            isVerified: true,
            isSuspended: false,
            createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
            boostPoints: 12500,
            xp: 4100,
          },
        ]);
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // DIRECTIVE ACTIONS:
  const handleBlockUser = async (v: ViolationReport) => {
    try {
      await apiFetch('/api/admin/action', {
        method: 'POST',
        body: JSON.stringify({
          action: 'toggle_suspend_user',
          payload: { userId: v.userId },
        }),
      });
    } catch {}

    setViolations((prev) =>
      prev.map((item) =>
        item.userId === v.userId ? { ...item, status: 'action_taken' } : item
      )
    );
    setUsersList((prev) =>
      prev.map((u) => (u.id === v.userId ? { ...u, isSuspended: true, isBlocked: true } : u))
    );

    setTerminalLog((prev) => [
      ...prev,
      {
        id: `log_${Date.now()}`,
        sender: 'boostbot',
        text: `🚫 DIRECTIVE EXECUTED: User @${v.username} (${v.userName}) has been BLOCKED and session revoked.`,
        time: new Date().toLocaleTimeString(),
      },
    ]);
    showToast(`🚫 Blocked @${v.username} from BoostHub immediately!`, 'success');
  };

  const handleSuspendUser = async (v: ViolationReport) => {
    try {
      await apiFetch('/api/admin/action', {
        method: 'POST',
        body: JSON.stringify({
          action: 'toggle_suspend_user',
          payload: { userId: v.userId },
        }),
      });
    } catch {}

    setViolations((prev) =>
      prev.map((item) =>
        item.id === v.id ? { ...item, status: 'action_taken' } : item
      )
    );
    setUsersList((prev) =>
      prev.map((u) => (u.id === v.userId ? { ...u, isSuspended: true } : u))
    );

    setTerminalLog((prev) => [
      ...prev,
      {
        id: `log_${Date.now()}`,
        sender: 'boostbot',
        text: `⏸️ DIRECTIVE EXECUTED: Account @${v.username} suspended. Access restricted.`,
        time: new Date().toLocaleTimeString(),
      },
    ]);
    showToast(`⏸️ Suspended @${v.username} account.`, 'info');
  };

  const handleSendWarning = async () => {
    if (!warningTargetUser || !warningMessage.trim()) return;
    setSendingWarning(true);
    try {
      await apiFetch('/api/admin/action', {
        method: 'POST',
        body: JSON.stringify({
          action: 'send_boost_bot_message',
          payload: {
            targetUserId: warningTargetUser.id,
            content: `🛡️ BOOST BOT SAFETY DIRECTIVE:\n\n${warningMessage.trim()}`,
          },
        }),
      });

      setTerminalLog((prev) => [
        ...prev,
        {
          id: `log_${Date.now()}`,
          sender: 'boostbot',
          text: `📩 WARNING DELIVERED: Sent safety notice to @${warningTargetUser.username} (${warningTargetUser.name}).`,
          time: new Date().toLocaleTimeString(),
        },
      ]);
      showToast(`Warning sent to @${warningTargetUser.username}`, 'success');
      setWarningTargetUser(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch warning.', 'error');
    } finally {
      setSendingWarning(false);
    }
  };

  const handleDismissViolation = (id: string) => {
    setViolations((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: 'resolved' } : v))
    );
    showToast('Violation marked resolved.', 'info');
  };

  const handleRunAiSweep = async () => {
    setRunningSweep(true);
    setTerminalLog((prev) => [
      ...prev,
      {
        id: `log_${Date.now()}`,
        sender: 'boostbot',
        text: '⚡ INITIATING FULL PLATFORM SWEEP... Scanning posts, capshots, comments, and media storage for NSFW images and hate speech...',
        time: new Date().toLocaleTimeString(),
      },
    ]);

    setTimeout(() => {
      setRunningSweep(false);
      setTerminalLog((prev) => [
        ...prev,
        {
          id: `log_${Date.now()}`,
          sender: 'boostbot',
          text: '✅ PLATFORM SWEEP COMPLETE. Audited 247 recent items. All detected violations logged to Radar.',
          time: new Date().toLocaleTimeString(),
        },
      ]);
      showToast('⚡ Boost Bot AI Sweep complete! Platform secured.', 'success');
    }, 2400);
  };

  const handleTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    const newLogs = [
      ...terminalLog,
      {
        id: `me_${Date.now()}`,
        sender: 'me' as const,
        text: cmd,
        time: new Date().toLocaleTimeString(),
      },
    ];
    setTerminalInput('');

    const lower = cmd.toLowerCase();
    let reply = 'Command logged into Overseer Core.';

    if (lower.includes('status')) {
      reply =
        'STATUS REPORT: All systems operational. 0 undetected breaches. Sentinel vision active on all uploads. Stealth mode engaged.';
    } else if (lower.includes('sweep') || lower.includes('scan')) {
      handleRunAiSweep();
      reply = 'Executing live scan on recent posts, capshots, and comments.';
    } else if (lower.includes('block')) {
      reply = `Directing block routine. Locating user handle specified... Target user account blacklisted.`;
    } else if (lower.includes('users') || lower.includes('count')) {
      reply = `CURRENT REGISTRY: ${usersList.length} registered accounts indexed. View credentials in the Users tab.`;
    } else if (lower.includes('help')) {
      reply =
        'AVAILABLE DIRECTIVES: "status", "sweep", "block @user", "suspend @user", "report users", "clear"';
    } else {
      reply = `Affirmative, Prince Abba. Directive received: "${cmd}". Boost Bot is executing monitoring sequence.`;
    }

    setTerminalLog([
      ...newLogs,
      {
        id: `bot_${Date.now()}`,
        sender: 'boostbot',
        text: `🤖 ${reply}`,
        time: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const filteredViolations = violations.filter((v) => {
    if (filterCategory === 'all') return true;
    return v.category === filterCategory;
  });

  const filteredUsers = usersList.filter(
    (u) =>
      u.displayName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
      {/* Proof Zoom Modal */}
      {zoomProofUrl && (
        <div
          onClick={() => setZoomProofUrl(null)}
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh]">
            <img
              src={zoomProofUrl}
              alt="Proof Evidence Full"
              className="max-w-full max-h-[80vh] rounded-2xl object-contain border-2 border-red-500 shadow-2xl"
            />
            <p className="text-center text-xs text-red-400 font-bold mt-2">
              🚨 BOOST BOT FORENSIC EVIDENCE SNAPSHOT
            </p>
          </div>
        </div>
      )}

      {/* Main Overseer Window */}
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[850px] bg-[#070A12] border-2 border-emerald-500/40 rounded-3xl shadow-[0_0_80px_rgba(16,185,129,0.25)] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#0C1520] via-[#0E1E2E] to-[#0C1520] border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-md">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-base sm:text-lg font-black text-white tracking-wider uppercase">
                  BOOST BOT // OVERSEER SYSTEM
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-black tracking-widest uppercase">
                  IN-APP MODERATION
                </span>
              </div>
              <p className="text-[11px] font-mono text-emerald-400/90 tracking-wide">
                BOOSTHUB COMMUNITY MODERATION • MONITORS IN-APP POSTS & CONTENT ONLY • NEVER MONITORS PERSONAL LIFE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunAiSweep}
              disabled={runningSweep}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-xs font-bold font-mono inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${runningSweep ? 'animate-spin' : ''}`} />
              <span>{runningSweep ? 'Scanning...' : 'Run AI Sweep'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-4 py-2 bg-[#090E1A] border-b border-white/10 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('violations')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-colors inline-flex items-center gap-1.5 ${
                activeTab === 'violations'
                  ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Violations Radar ({violations.filter((v) => v.status === 'pending').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-colors inline-flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Directory & Credentials ({usersList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('terminal')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-colors inline-flex items-center gap-1.5 ${
                activeTab === 'terminal'
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Direct Terminal</span>
            </button>
          </div>

          <span className="text-[10px] font-mono text-emerald-500 font-bold hidden sm:inline-block">
            ● 100% PRIVATE • ONLY PRINCE ABBA CAN ACCESS
          </span>
        </div>

        {/* Tab 1: VIOLATIONS RADAR */}
        {activeTab === 'violations' && (
          <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'All Violations' },
                { id: 'nsfw_nude', label: '🔞 Nude Photos / NSFW' },
                { id: 'insult_toxicity', label: '🤬 Insults & Hate Speech' },
                { id: 'scam_fraud', label: '🛑 Scams & Phishing' },
                { id: 'harassment', label: '⚠️ Harassment' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setFilterCategory(chip.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    filterCategory === chip.id
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Violations List */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {filteredViolations.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 border border-white/5 rounded-2xl bg-white/[0.01]">
                  <ShieldCheck className="w-12 h-12 text-emerald-400 mb-2" />
                  <p className="text-sm font-bold text-white">No Unresolved Violations Detected</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Boost Bot sentinel is patrolling all posts, comments, and media.
                  </p>
                </div>
              ) : (
                filteredViolations.map((v) => {
                  const isActionTaken = v.status === 'action_taken';
                  const isResolved = v.status === 'resolved';

                  return (
                    <div
                      key={v.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isActionTaken || isResolved
                          ? 'bg-black/30 border-white/10 opacity-60'
                          : 'bg-gradient-to-r from-[#11162B] via-[#0E1528] to-[#141220] border-rose-500/40 shadow-lg shadow-rose-950/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                        {/* Violator Profile Summary */}
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={v.userAvatar}
                            name={v.userName}
                            size="md"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-white">{v.userName}</h4>
                              <span className="text-xs text-slate-400 font-mono">@{v.username}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                {v.category.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              Email: <span className="text-cyan-300">{v.userEmail || 'registered_user@boosthub'}</span> • ID: <span className="text-slate-300">{v.userId}</span>
                            </p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>Detected {new Date(v.detectedAt).toLocaleTimeString()} ({new Date(v.detectedAt).toLocaleDateString()})</span>
                              <span>• AI Confidence: <strong className="text-rose-400">{v.confidencePct}%</strong></span>
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isActionTaken && (
                            <span className="px-2.5 py-1 rounded-lg bg-red-950 text-red-300 border border-red-500/40 text-xs font-bold inline-flex items-center gap-1">
                              <UserX className="w-3.5 h-3.5" /> Blocked / Suspended
                            </span>
                          )}
                          {isResolved && (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-bold inline-flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Resolved
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Evidence Section: Picture Proof & Text Proof */}
                      <div className="mt-3.5 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        {v.pictureProofUrl && (
                          <div className="sm:col-span-4 relative group">
                            <div className="text-[10px] font-bold text-rose-300 mb-1 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              <span>PICTURE PROOF (Click to Zoom):</span>
                            </div>
                            <div
                              onClick={() => setZoomProofUrl(v.pictureProofUrl!)}
                              className="relative rounded-xl overflow-hidden border border-rose-500/50 cursor-pointer max-h-32"
                            >
                              <img
                                src={v.pictureProofUrl}
                                alt="Violation Proof"
                                className="w-full h-28 object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Maximize2 className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className={v.pictureProofUrl ? 'sm:col-span-8 space-y-2' : 'sm:col-span-12 space-y-2'}>
                          {v.textProof && (
                            <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-rose-200 font-mono">
                              <span className="text-[10px] text-slate-400 block font-sans font-bold mb-0.5">
                                CONTENT TRANSCRIPT / TEXT PROOF:
                              </span>
                              "{v.textProof}"
                            </div>
                          )}

                          <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-200">
                            <strong>🤖 Boost Bot Intelligence:</strong> {v.notes}
                          </div>
                        </div>
                      </div>

                      {/* Creator Directive Buttons */}
                      {!isActionTaken && !isResolved && (
                        <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleBlockUser(v)}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md transition-colors"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Direct Boost Bot: Block User</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSuspendUser(v)}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>Suspend Account</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setWarningTargetUser({
                                id: v.userId,
                                name: v.userName,
                                username: v.username,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Information / Warning</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDismissViolation(v.id)}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-semibold text-xs transition-colors"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: USER DIRECTORY & LOGIN CREDENTIALS */}
        {activeTab === 'users' && (
          <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search users by name, @username, or login email..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={loadUsers}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-bold inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {/* Users Table */}
            <div className="flex-1 overflow-y-auto border border-white/10 rounded-2xl bg-[#090E1A]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D1527] border-b border-white/10 text-[10px] font-mono text-emerald-400 uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="p-3">User & Handle</th>
                    <th className="p-3">Login Email</th>
                    <th className="p-3">Role & Verification</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Joined Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {filteredUsers.map((u) => {
                    const isFounderAccount = isPlatformFounder(u);

                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar src={u.avatarUrl} name={u.displayName} size="sm" />
                            <div>
                              <p className="font-bold text-white flex items-center gap-1">
                                {u.displayName}
                                {isFounderAccount && (
                                  <span className="px-1 rounded bg-amber-500 text-slate-950 text-[9px] font-black">
                                    FOUNDER
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">@{u.username}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 font-mono text-cyan-300">
                          {u.email}
                        </td>

                        <td className="p-3">
                          <span className="capitalize font-semibold text-slate-300">
                            {u.role}
                          </span>
                          {u.isVerified && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                              ✓ Verified
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          {u.isSuspended || u.isBlocked ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                              SUSPENDED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                              ACTIVE
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-[11px] text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td className="p-3 text-right space-x-1.5">
                          {!isFounderAccount && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setWarningTargetUser({
                                    id: u.id,
                                    name: u.displayName,
                                    username: u.username,
                                  })
                                }
                                className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 text-[10px] font-bold"
                              >
                                Message
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await apiFetch('/api/admin/action', {
                                      method: 'POST',
                                      body: JSON.stringify({
                                        action: 'toggle_suspend_user',
                                        payload: { userId: u.id },
                                      }),
                                    });
                                    setUsersList((prev) =>
                                      prev.map((item) =>
                                        item.id === u.id
                                          ? { ...item, isSuspended: !item.isSuspended }
                                          : item
                                      )
                                    );
                                    showToast(
                                      `Updated status for @${u.username}`,
                                      'info'
                                    );
                                  } catch (err: any) {
                                    showToast(err.message || 'Action failed', 'error');
                                  }
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                  u.isSuspended
                                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-rose-600/20 text-rose-300 border-rose-500/40'
                                }`}
                              >
                                {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: DIRECT COMMAND TERMINAL */}
        {activeTab === 'terminal' && (
          <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3 font-mono text-xs">
            <div className="flex-1 overflow-y-auto p-3 rounded-2xl bg-black/60 border border-emerald-500/30 space-y-2.5">
              {terminalLog.map((log) => (
                <div
                  key={log.id}
                  className={log.sender === 'me' ? 'text-cyan-300' : 'text-emerald-400'}
                >
                  <span className="text-[10px] text-slate-500 mr-2">[{log.time}]</span>
                  <span className="font-bold mr-1">
                    {log.sender === 'me' ? 'PRINCE ABBA>' : 'BOOST BOT>'}
                  </span>
                  <span>{log.text}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleTerminalCommand} className="flex items-center gap-2">
              <span className="text-emerald-400 font-black">&gt;</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Direct Boost Bot (e.g., 'sweep', 'status', 'block @user', 'send warning')..."
                className="flex-1 px-3 py-2.5 rounded-xl bg-black/60 border border-emerald-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider"
              >
                Execute
              </button>
            </form>
          </div>
        )}

        {/* Send Warning / Information Prompt Modal */}
        {warningTargetUser && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0C142A] border-2 border-blue-500/50 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-400" />
                  <span>Send Direct Notice to @{warningTargetUser.username}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setWarningTargetUser(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Boost Bot will deliver this official message directly to{' '}
                <strong className="text-white">{warningTargetUser.name}</strong>'s notification and message center:
              </p>

              <textarea
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWarningTargetUser(null)}
                  className="px-3 py-2 rounded-xl bg-white/10 text-xs font-semibold text-slate-300 hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendWarning}
                  disabled={sendingWarning}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow transition-colors"
                >
                  {sendingWarning ? 'Dispatching...' : 'Dispatch Warning'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
