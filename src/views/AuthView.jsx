import { useState } from 'react';
import { Activity, Image as ImageIcon, LoaderCircle, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

export function AuthView({ initialError = '' }) {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(initialError);
  const [avatarFile, setAvatarFile] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError('');
    setIsSubmitting(true);
    try {
      if (isRegistering) {
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
          <div className="w-11 h-11 bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-amber-400 rounded-2xl flex items-center justify-center">
            <Activity className="text-white" size={23} />
          </div>
          <div>
            <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-500">Vibely</p>
            <p className="text-xs text-slate-400">Share your vibe</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isRegistering ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          {isRegistering ? 'Find your people and share what moves you.' : 'Sign in to pick up where you left off.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
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
          <input name="password" type="password" required autoComplete={isRegistering ? 'new-password' : 'current-password'} placeholder="Password" className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />

          {error && <p className="text-sm text-rose-600 dark:text-rose-400" role="alert">{error}</p>}
          <button disabled={isSubmitting} className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white p-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-colors">
            {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
            {isRegistering ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          onClick={() => { setIsRegistering((current) => !current); setError(''); }}
          className="w-full mt-5 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
        >
          {isRegistering ? 'Already have an account? Sign in' : 'New to Vibely? Create an account'}
        </button>
      </section>
    </main>
  );
}
