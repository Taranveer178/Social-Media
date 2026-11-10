import { useState } from 'react';
import { Eye, EyeOff, Image as ImageIcon, LoaderCircle, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { BrandMark } from '../components/ui/BrandMark';

export function AuthView({ initialError = '' }) {
  const { login, register, sendPasswordReset } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(initialError);
  const [status, setStatus] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError('');
    setStatus('');
    setIsSubmitting(true);
    try {
      if (isResettingPassword) {
        const email = form.get('email');
        await sendPasswordReset(email);
        setStatus(`Password reset link sent to ${email}. Check your inbox to set a new password.`);
      } else if (isRegistering) {
        await register({
          email: form.get('email'),
          name: form.get('name'),
          username: form.get('username'),
          bio: form.get('bio'),
          avatarFile,
          password: form.get('password'),
        });
      } else {
        await login({
          email: form.get('email'),
          password: form.get('password'),
        });
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl p-7 md:p-9">
        <div className="flex items-center gap-3 mb-7">
          <BrandMark size="lg" />
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">Vibely</p>
            <p className="text-xs text-slate-400">Share your vibe</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isResettingPassword ? 'Reset your password' : isRegistering ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          {isResettingPassword
            ? 'Enter your email and we will send you a secure link to choose a new password.'
            : isRegistering
              ? 'Find your people and share what moves you.'
              : 'Sign in to pick up where you left off.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && !isResettingPassword && (
            <>
              <input name="name" required autoComplete="name" placeholder="Full name" className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              <input name="email" type="email" required autoComplete="email" placeholder="Email address" className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-2xl px-3.5">
                <span className="text-slate-400">@</span>
                <input name="username" required autoComplete="username" placeholder="Username" className="w-full bg-transparent text-slate-900 dark:text-white p-3.5 text-sm focus:outline-none" />
              </div>
              <textarea name="bio" placeholder="A little about you" className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" rows="3" />
              <label className="flex items-center gap-3 text-sm text-slate-500 cursor-pointer">
                <ImageIcon size={18} />
                <span>{avatarFile?.name || 'Choose a profile photo (optional)'}</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} />
              </label>
            </>
          )}

          {!isRegistering && (
            <input name="email" type="email" required autoComplete="email" placeholder="Email address" className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          )}
          {!isResettingPassword && (
            <div className="relative">
              <input
                name="password"
                type={isPasswordVisible ? 'text' : 'password'}
                required
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                placeholder="Password"
                className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3.5 pr-12 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                aria-pressed={isPasswordVisible}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-violet-600"
              >
                {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {!isRegistering && !isResettingPassword && (
            <div className="text-right -mt-1">
              <button
                type="button"
                onClick={() => { setIsResettingPassword(true); setError(''); setStatus(''); }}
                className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}
          {error && <p className="text-sm text-rose-600 dark:text-rose-400" role="alert">{error}</p>}
          {status && <p className="text-sm text-green-700 dark:text-green-400" role="status">{status}</p>}
          <button disabled={isSubmitting} className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white p-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-colors">
            {isSubmitting
              ? <LoaderCircle size={18} className="animate-spin" />
              : isResettingPassword
                ? <LogIn size={18} />
                : isRegistering
                  ? <UserPlus size={18} />
                  : <LogIn size={18} />}
            {isResettingPassword ? 'Send reset link' : isRegistering ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {isResettingPassword ? (
          <button
            type="button"
            onClick={() => { setIsResettingPassword(false); setError(''); setStatus(''); }}
            className="w-full mt-5 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
          >
            Back to sign in
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setIsRegistering((current) => !current); setError(''); setStatus(''); }}
            className="w-full mt-5 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
          >
            {isRegistering ? 'Already have an account? Sign in' : 'New to Vibely? Create an account'}
          </button>
        )}
      </section>
    </main>
  );
}
