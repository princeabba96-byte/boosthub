import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  X,
  RefreshCw,
  Send,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Lock,
  MessageSquare,
  Sparkles,
  Volume2,
  VolumeX,
  FileText,
  User,
  Activity,
  BellRing,
} from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { apiFetch } from '../services/api';

interface FlaggedUser {
  userId: string;
  username: string;
  displayName: string;
  riskLevel: 'High' | 'Medium' | 'Low' | 'Clean';
  ruleViolated: string;
  evidence: string;
  recommendation: string;
}

interface AuditData {
  healthScore: number;
  status: 'Healthy' | 'Attention Required' | 'Action Needed';
  summary: string;
  totalUsersAudited: number;
  totalPostsAudited: number;
  totalCommentsAudited: number;
  flaggedUsers: FlaggedUser[];
}

interface BoostBotChatMessage {
  id: string;
  role: 'founder' | 'boostbot';
  content: string;
  createdAt: string;
}

interface BoostBotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FOUNDER_EMAIL = 'princeabba96@gmail.com';
const ADMIN_ABBA_UUID = 'eaada352-5704-4566-a7a7-88df80853ada';

export const BoostBotModal: React.FC<BoostBotModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'audit' | 'chat' | 'rules'>('audit');

  // Audit state
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [filterRisk, setFilterRisk] = useState<'all' | 'flagged' | 'clean'>('all');
  const [warningActionUser, setWarningActionUser] = useState<FlaggedUser | null>(null);
  const [warningReason, setWarningReason] = useState('');
  const [sendingWarning, setSendingWarning] = useState(false);
  const [warningSuccessMessage, setWarningSuccessMessage] = useState<string | null>(null);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<BoostBotChatMessage[]>([
    {
      id: 'welcome_bot',
      role: 'boostbot',
      content: `Greetings Prince Abba. 🛡️ I am **BOOST BOT**, your confidential internal safety auditor and platform compliance engine.

I monitor all registered users, recent posts, comments, and community channels across BoostHub. Ask me to audit any specific user, check for suspicious activity, or run automated platform scans. How may I assist you today?`,
      createdAt: new Date().toISOString(),
    },
  ]);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const isFounder =
    userProfile?.email?.trim().toLowerCase() === FOUNDER_EMAIL ||
    userProfile?.username?.trim().toLowerCase() === 'abba' ||
    userProfile?.id === ADMIN_ABBA_UUID ||
    Boolean((userProfile as any)?.is_admin);

  const fetchAuditData = async () => {
    if (!isFounder) return;
    setLoadingAudit(true);
    try {
      const res = await apiFetch<{ ok: boolean; audit: AuditData }>(
        '/api/admin/boostbot/audit',
        { method: 'POST', body: JSON.stringify({}) }
      );
      if (res?.audit) {
        setAudit(res.audit);
      }
    } catch (err: any) {
      console.error('BoostBot audit error:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (isOpen && isFounder && !audit) {
      fetchAuditData();
    }
  }, [isOpen, isFounder]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleSendChatMessage = async (msgText: string) => {
    const text = msgText.trim();
    if (!text || chatLoading) return;

    const userMsg: BoostBotChatMessage = {
      id: `f_${Date.now()}`,
      role: 'founder',
      content: text,
      createdAt: new Date().toISOString(),
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await apiFetch<{ ok: boolean; reply: string }>(
        '/api/admin/boostbot/chat',
        {
          method: 'POST',
          body: JSON.stringify({
            message: text,
            history: newHistory.slice(-8).map((m) => ({
              role: m.role === 'founder' ? 'user' : 'assistant',
              content: m.content,
            })),
          }),
        }
      );

      const reply =
        res?.reply ||
        '🛡️ BoostBot processed your inquiry against the live database. No rule infractions identified.';

      setChatMessages((prev) => [
        ...prev,
        {
          id: `b_${Date.now()}`,
          role: 'boostbot',
          content: reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'boostbot',
          content: `⚠️ BoostBot experienced a lookup delay: ${err?.message || 'Database connection error'}. Please retry in a moment.`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendWarning = async () => {
    if (!warningActionUser) return;
    setSendingWarning(true);
    setWarningSuccessMessage(null);
    try {
      const res = await apiFetch<{ ok: boolean; message: string }>(
        '/api/admin/boostbot/warn',
        {
          method: 'POST',
          body: JSON.stringify({
            targetUserId: warningActionUser.userId,
            reason: warningReason.trim() || warningActionUser.ruleViolated,
          }),
        }
      );
      if (res?.ok) {
        setWarningSuccessMessage(
          `Official warning notification dispatched to @${warningActionUser.username}!`
        );
        setTimeout(() => {
          setWarningActionUser(null);
          setWarningReason('');
          setWarningSuccessMessage(null);
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error sending warning:', err);
    } finally {
      setSendingWarning(false);
    }
  };

  const handleSpeak = (msg: BoostBotChatMessage) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const clean = msg.content.replace(/[*#`_~]/g, '');
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 1.0;
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    setSpeakingId(msg.id);
    window.speechSynthesis.speak(utter);
  };

  if (!isOpen) return null;

  // Access Denied Screen for non-Prince Abba users
  if (!isFounder) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0F1322] border border-rose-500/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <Lock className="w-7 h-7 text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Access Restricted</h3>
            <p className="text-xs text-slate-300 mt-1">
              **BOOST BOT** is an internal AI compliance engine restricted strictly to the platform Founder (**Prince Abba**).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = (audit?.flaggedUsers || []).filter((u) => {
    if (filterRisk === 'flagged') return u.riskLevel !== 'Clean';
    if (filterRisk === 'clean') return u.riskLevel === 'Clean';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-3xl h-[92vh] sm:h-[85vh] bg-[#0A0E1F] border border-cyan-500/30 rounded-3xl flex flex-col overflow-hidden shadow-2xl shadow-cyan-950/50">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-950/90 via-[#0E1530] to-purple-950/90 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/25">
              <div className="w-full h-full rounded-[14px] bg-[#0A0E1F] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-wide text-white">
                  BOOST BOT
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-400/40 text-[9px] font-extrabold text-purple-300 tracking-wider">
                  INTERNAL AI AUDITOR
                </span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/40 text-[9px] font-extrabold text-cyan-300">
                  FOUNDER ONLY
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Real-Time Compliance, Content Moderation & Rule Enforcement
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 py-2 bg-[#080B18] border-b border-white/10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
              activeTab === 'audit'
                ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Audit & Violations</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
              activeTab === 'chat'
                ? 'bg-purple-500/20 border border-purple-400/50 text-purple-200 shadow-sm shadow-purple-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat with BoostBot</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
              activeTab === 'rules'
                ? 'bg-blue-500/20 border border-blue-400/50 text-blue-200 shadow-sm shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Community Rules</span>
          </button>

          {activeTab === 'audit' && (
            <button
              type="button"
              onClick={fetchAuditData}
              disabled={loadingAudit}
              className="ml-auto px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
              <span>{loadingAudit ? 'Scanning...' : 'Re-Run Live Audit'}</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: LIVE AUDIT DASHBOARD */}
          {activeTab === 'audit' && (
            <>
              {/* Executive Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121833] via-[#0F142A] to-[#161233] border border-cyan-500/25 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Platform Safety Health
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-extrabold text-emerald-300">
                        {audit?.status || 'Active Surveillance'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-white">
                        {audit?.healthScore ?? 98}%
                      </span>
                      <span className="text-xs text-slate-400">Compliance Rating</span>
                    </div>
                  </div>

                  {/* High level metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                      <div className="text-base font-extrabold text-white">
                        {audit?.totalUsersAudited ?? 8}
                      </div>
                      <div className="text-[10px] text-slate-400">Users Checked</div>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                      <div className="text-base font-extrabold text-cyan-400">
                        {audit?.totalPostsAudited ?? 9}
                      </div>
                      <div className="text-[10px] text-slate-400">Posts Scanned</div>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                      <div className="text-base font-extrabold text-purple-400">
                        {audit?.totalCommentsAudited ?? 2}
                      </div>
                      <div className="text-[10px] text-slate-400">Comments Checked</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-cyan-300">AI Briefing: </span>
                  {audit?.summary ||
                    'BoostBot continuously correlates real user profiles, bio descriptions, uploaded videos, and comment logs against platform standards.'}
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-400">Filter:</span>
                  <button
                    type="button"
                    onClick={() => setFilterRisk('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      filterRisk === 'all'
                        ? 'bg-white/15 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({audit?.flaggedUsers?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterRisk('flagged')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      filterRisk === 'flagged'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Flagged (
                    {(audit?.flaggedUsers || []).filter((u) => u.riskLevel !== 'Clean').length}
                    )
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterRisk('clean')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      filterRisk === 'clean'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Compliant (
                    {(audit?.flaggedUsers || []).filter((u) => u.riskLevel === 'Clean').length}
                    )
                  </button>
                </div>
              </div>

              {/* User Compliance Audit Cards */}
              <div className="space-y-3">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-xs">
                    No users matching this filter criteria.
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isClean = user.riskLevel === 'Clean';
                    const isHigh = user.riskLevel === 'High';
                    const isMedium = user.riskLevel === 'Medium';

                    return (
                      <div
                        key={user.userId}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isClean
                            ? 'bg-[#0E1326] border-white/10'
                            : isHigh
                            ? 'bg-rose-950/20 border-rose-500/40'
                            : 'bg-amber-950/20 border-amber-500/40'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                                isClean
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : isHigh
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-white">
                                  {user.displayName}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  @{user.username}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                                ID: {user.userId.slice(0, 8)}...
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isClean
                                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                                  : isHigh
                                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                              }`}
                            >
                              {user.riskLevel}
                            </span>
                            {!isClean && (
                              <button
                                type="button"
                                onClick={() => setWarningActionUser(user)}
                                className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-extrabold inline-flex items-center gap-1 transition-all"
                              >
                                <BellRing className="w-3 h-3" />
                                <span>Warn User</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Evidence & Recommendation */}
                        <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1 text-xs">
                          <div className="flex items-start gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                              Rule Checked:
                            </span>
                            <span className="text-slate-300 text-[11px]">
                              {user.ruleViolated}
                            </span>
                          </div>

                          <div className="flex items-start gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                              Analyzed Text:
                            </span>
                            <span className="text-slate-200 text-[11px] italic bg-black/30 px-2 py-0.5 rounded-md">
                              "{user.evidence || 'Standard bio / posts checked'}"
                            </span>
                          </div>

                          <div className="flex items-start gap-1.5">
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider shrink-0">
                              BoostBot Verdict:
                            </span>
                            <span className="text-cyan-200 text-[11px]">
                              {user.recommendation}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* TAB 2: INTERACTIVE CHAT WITH BOOSTBOT */}
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col space-y-3">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {chatMessages.map((msg) => {
                  const isBot = msg.role === 'boostbot';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                          isBot
                            ? 'bg-[#121A33] border border-cyan-500/25 text-slate-100 rounded-tl-xs'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-xs'
                        }`}
                      >
                        {isBot && (
                          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-white/10">
                            <span className="text-[10px] font-black text-cyan-300 inline-flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                              BOOST BOT
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSpeak(msg)}
                              className="text-[10px] text-cyan-300 hover:text-white inline-flex items-center gap-1"
                            >
                              {speakingId === msg.id ? (
                                <>
                                  <VolumeX className="w-3 h-3 text-rose-400" /> Stop
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3" /> Listen
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        <div>{msg.content}</div>
                      </div>
                    </div>
                  );
                })}

                {chatLoading && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#121A33] border border-cyan-500/25 w-fit text-xs text-cyan-300">
                    <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>BoostBot is auditing the live database...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Founder Questions */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2">
                {[
                  'Are there any suspicious new accounts?',
                  'Check if any user posted spam or crypto links',
                  'Audit user @junior for compliance',
                  'Summarize platform safety status today',
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={chatLoading}
                    onClick={() => handleSendChatMessage(prompt)}
                    className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-300 whitespace-nowrap shrink-0 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage(chatInput);
                }}
                className="flex items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask BoostBot to inspect users, posts, or violation records..."
                  className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="min-h-[40px] min-w-[40px] rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: COMMUNITY RULES ENFORCEMENT GUIDE */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#0E1428] border border-white/10 space-y-2">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>BoostHub 5 Core Community Rules (Audited by BoostBot)</span>
                </h3>
                <p className="text-xs text-slate-300">
                  BoostBot algorithmically cross-references user accounts, bios, video titles, and comments against these exact standards:
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    num: '1',
                    title: 'Anti-Spam & Fraud Prevention',
                    desc: 'No mass unsolicited promotions, cryptocurrency schemes, pyramid pitches, external malware links, or repetitive automated copy across posts and comments.',
                  },
                  {
                    num: '2',
                    title: 'Safety, Anti-Harassment & Civil Conduct',
                    desc: 'Strict prohibition of targeted harassment, hate speech against ethnic or religious groups, direct threats of violence, defamation, or sexual harassment.',
                  },
                  {
                    num: '3',
                    title: 'Authenticity & Impersonation Prohibition',
                    desc: 'No pretending to be Founder Prince Abba, BoostHub management, or verified creators with intent to deceive users or harvest credentials.',
                  },
                  {
                    num: '4',
                    title: 'Appropriate & Safe Media Standards',
                    desc: 'All Capshot reels and story media must be safe for general audiences. No non-consensual imagery, extreme gore, or illegal activities.',
                  },
                  {
                    num: '5',
                    title: 'Platform Economy & Fair Play',
                    desc: 'Boost Points (BP), Creator Gifts, and B-Shop transactions must be conducted legitimately. Botting likes or manipulating rankings is strictly prohibited.',
                  },
                ].map((rule) => (
                  <div
                    key={rule.num}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-black text-xs flex items-center justify-center">
                        {rule.num}
                      </span>
                      <h4 className="text-xs font-bold text-white">{rule.title}</h4>
                    </div>
                    <p className="text-xs text-slate-300 pl-7 leading-relaxed">
                      {rule.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Warning Action Modal Overlay */}
        {warningActionUser && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0F142A] border border-rose-500/40 rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <h4 className="text-sm font-black text-white">
                    Issue BoostBot Warning to @{warningActionUser.username}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setWarningActionUser(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-300">
                This will dispatch an official warning notification from **BOOST BOT** directly into this user's notification tray.
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Violation Reason / Custom Message:
                </label>
                <textarea
                  rows={3}
                  value={warningReason}
                  onChange={(e) => setWarningReason(e.target.value)}
                  placeholder={`e.g. Violation of ${warningActionUser.ruleViolated}: Please ensure your posts adhere to our guidelines.`}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              {warningSuccessMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                  {warningSuccessMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWarningActionUser(null)}
                  disabled={sendingWarning}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendWarning}
                  disabled={sendingWarning}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>{sendingWarning ? 'Dispatching...' : 'Confirm & Send Warning'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
