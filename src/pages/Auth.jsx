import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let authError;

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      authError = error;
      if (!error) alert('Success! Check your email for a confirmation link.');
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      authError = error;
      if (data?.session) onLogin(data.session);
    }

    if (authError) setError(authError.message);
    setLoading(false);
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    
    // Creates a secure, temporary background session
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) setError(error.message);
    if (data?.session) onLogin(data.session);
    
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm glass-card rounded-2xl p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <span className="material-symbols-outlined text-primary text-5xl">analytics</span>
          <h1 className="font-headline-md text-2xl font-bold text-on-surface">
            {isSignUp ? 'Create an Account' : 'Welcome to Synq'}
          </h1>
          <p className="text-on-surface-variant text-sm">
            {isSignUp ? 'Start organizing your focus.' : 'Log in to continue your streak.'}
          </p>
        </div>

        {error && (
          <div className="bg-error-container/20 border border-error/50 text-error text-sm p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-on-surface-variant ml-1">Email</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              placeholder="you@university.edu"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-bold text-on-surface-variant ml-1">Password</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            disabled={loading} type="submit" 
            className="w-full bg-primary text-on-primary font-bold text-lg py-3 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div className="relative flex items-center gap-4 my-2">
          <div className="flex-grow border-t border-outline-variant/10"></div>
          <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">OR</span>
          <div className="flex-grow border-t border-outline-variant/10"></div>
        </div>

        <button 
          type="button" 
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full bg-surface-container-high text-on-surface font-bold text-md py-3 rounded-xl border border-outline-variant/20 hover:bg-surface-container-lowest active:scale-95 transition-all disabled:opacity-50"
        >
          Continue as Guest
        </button>

        <p className="text-center text-sm text-on-surface-variant pt-2">
          {isSignUp ? 'Already have an account? ' : 'Need an account? '}
          <button 
            type="button" onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary font-bold hover:underline"
          >
            {isSignUp ? 'Log in' : 'Sign up'}
          </button>
        </p>

      </div>
    </div>
  );
}