import React, { useState, useRef } from 'react';
import {
  Mail,
  Lock,
  User,
  AtSign,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  Camera,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { Avatar } from '../components/Avatar';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=240&auto=format&fit=crop&q=80',
];

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const AuthScreen: React.FC = () => {
  const {
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    resetPassword,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [googlePromptOpen, setGooglePromptOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setSelectedAvatar(dataUrl);
    } catch (err: any) {
      setError(err.message || 'Could not process selected photo.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password, selectedAvatar || undefined);
      } else if (mode === 'signup') {
        await signupWithEmail(
          email,
          password,
          displayName,
          username,
          selectedAvatar || undefined
        );
      } else if (mode === 'forgot') {
        await resetPassword(email, newPassword);
        setSuccessMsg('Password updated! You can now sign in with your new password.');
        setMode('login');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenGoogleChooser = () => {
    setError('');
    // Always open the Gmail chooser modal so the user explicitly chooses which Gmail account to sign in with
    setGoogleEmailInput(email.trim());
    setGoogleNameInput(displayName.trim());
    setGooglePromptOpen(true);
  };

  const handleConfirmGoogleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = googleEmailInput.trim().toLowerCase();
    if (!cleanEmail) return;
    setError('');
    setSubmitting(true);
    try {
      await loginWithGoogle(
        selectedAvatar || undefined,
        cleanEmail,
        googleNameInput.trim() || undefined
      );
      setGooglePromptOpen(false);
    } catch (err: any) {
      setError(err.message || 'Could not sign in with Google.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060813] text-white flex flex-col lg:flex-row">
      {/* Left Hero Showcase */}
      <div className="lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between bg-gradient-to-br from-[#0B122C] via-[#080C1E] to-[#060813] border-b lg:border-b-0 lg:border-r border-white/10">
        <div>
          <span className="font-display text-2xl font-extrabold tracking-tight text-white">
            BoostHub
          </span>
        </div>

        <div className="my-10 lg:my-0 max-w-xl space-y-6">
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Create, Connect, and Amplify Your World.
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            Every user gets their own personal BoostHub account. Sign in or
            create a new account to choose your favorite categories, connect
            with friends, and turn on Professional Mode whenever you are ready
            to grow followers and compete for monetization.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <p className="text-sm font-semibold text-white">
                Friends First, Creator When Ready
              </p>
              <p className="text-xs text-slate-400 mt-1">
                New accounts start in Friends Mode. Turn on Professional Mode in
                Settings to unlock Followers & Creator Competitions.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <p className="text-sm font-semibold text-white">
                Daily Missions & Real-Time Comments
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Complete daily challenges with confetti rewards, and comment or
                reply across every account in real time.
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>BoostHub Social Platform · Isolated Per-User Cloud Accounts</span>
        </div>
      </div>

      {/* Right Authentication Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-[#0B1021] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              {mode === 'login'
                ? 'Sign in to your account'
                : mode === 'signup'
                  ? 'Create your BoostHub account'
                  : 'Reset your password'}
            </h2>
            <p className="text-xs text-slate-400 mt-1.5">
              {mode === 'login'
                ? 'Enter your email or Gmail address. Each email signs into its own unique BoostHub account.'
                : mode === 'signup'
                  ? 'Create your own account, pick your favorite categories, and tell us why you joined BoostHub.'
                  : 'Enter your account email and choose a new password.'}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/5 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`py-2 text-xs font-semibold rounded-xl transition-colors ${
                  mode === 'login'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className={`py-2 text-xs font-semibold rounded-xl transition-colors ${
                  mode === 'signup'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create New Account
              </button>
            </div>
          )}

          {/* Profile Picture Picker on Sign In & Create Account */}
          {mode !== 'forgot' && (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={selectedAvatar}
                    name={displayName || email || 'You'}
                    size="lg"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Choose Profile Picture
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Displayed on your account & comments
                    </p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                {PRESET_AVATARS.map((url, idx) => {
                  const isChosen = selectedAvatar === url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(url)}
                      className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-transform ${
                        isChosen
                          ? 'border-blue-500 scale-110'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                      title={`Preset Avatar ${idx + 1}`}
                    >
                      <img
                        src={url}
                        alt={`Avatar ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {isChosen && (
                        <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Johnson"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) =>
                        setUsername(
                          e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                        )
                      }
                      placeholder="username"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email / Gmail Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {mode !== 'forgot' ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError('');
                      }}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-40 transition-all"
            >
              <span>
                {submitting
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Sign In to BoostHub'
                    : mode === 'signup'
                      ? 'Create Account & Choose Categories'
                      : 'Reset Password'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs text-slate-400 hover:text-white"
            >
              Back to Sign In
            </button>
          ) : (
            <>
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/10" />
                <span className="shrink mx-3 text-xs text-slate-500">or</span>
                <div className="flex-grow border-t border-white/10" />
              </div>

              <button
                type="button"
                onClick={handleOpenGoogleChooser}
                disabled={submitting}
                className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white flex items-center justify-center gap-3 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>Continue with Google (Choose Gmail Account)</span>
              </button>

              {googlePromptOpen && (
                <form
                  onSubmit={handleConfirmGoogleEmail}
                  className="p-4 rounded-2xl bg-[#131A2A] border border-blue-500/40 space-y-3 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">
                        Sign in with your Gmail Account
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Each Gmail has its own separate BoostHub account.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGooglePromptOpen(false)}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="email"
                    required
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    placeholder="Enter your Gmail (e.g. myaccount@gmail.com)"
                    className="w-full h-10 px-3 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={googleNameInput}
                    onChange={(e) => setGoogleNameInput(e.target.value)}
                    placeholder="Your Display Name (for new account)"
                    className="w-full h-10 px-3 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !googleEmailInput.trim()}
                    className="w-full py-2.5 rounded-xl bg-[#2B8CFF] hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                  >
                    {submitting
                      ? 'Signing in...'
                      : `Continue as ${googleEmailInput.trim() || 'Gmail User'}`}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
