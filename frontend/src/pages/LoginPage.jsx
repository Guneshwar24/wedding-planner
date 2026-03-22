import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginWithEmail } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await loginWithEmail(email.trim().toLowerCase());
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#FDFBF7' }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl mb-2" style={{ color: '#C05621' }}>
            Shaadi Brain
          </h1>
          <p className="font-body text-sm" style={{ color: '#8C7B75' }}>
            Your wedding, beautifully planned
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="font-body text-xs font-semibold mb-1 block"
              style={{ color: '#4A3A35' }}
            >
              Email Address
            </label>
            <input
              id="email"
              data-testid="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full font-body text-sm px-4 py-3 rounded-xl border outline-none"
              style={{ borderColor: '#E2D8D0', backgroundColor: '#FFF5F0', color: '#4A3A35' }}
            />
          </div>

          <button
            data-testid="login-btn"
            type="submit"
            disabled={loading}
            className="w-full font-body font-semibold text-sm text-white rounded-full py-3 mt-2 flex items-center justify-center gap-2 transition-opacity"
            style={{ backgroundColor: '#C05621', opacity: loading ? 0.75 : 1 }}
          >
            {loading ? <><Spinner /><span>Signing in...</span></> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
