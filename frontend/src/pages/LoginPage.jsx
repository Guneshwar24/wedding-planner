import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await login(phone, password);
      if (error) {
        toast.error(error.message);
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#FDFBF7' }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-lg p-8"
      >
        {/* Heading */}
        <div className="text-center mb-8">
          <h1
            className="font-heading text-4xl mb-2"
            style={{ color: '#C05621' }}
          >
            Shaadi Brain
          </h1>
          <p
            className="font-body text-sm"
            style={{ color: '#8C7B75' }}
          >
            Your wedding, beautifully planned
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Phone Input */}
          <div>
            <label
              htmlFor="phone"
              className="font-body text-xs font-semibold mb-1 block"
              style={{ color: '#4A3A35' }}
            >
              Phone Number
            </label>
            <div
              className="flex items-center rounded-xl border overflow-hidden"
              style={{ borderColor: '#E2D8D0', backgroundColor: '#FFF5F0' }}
            >
              <span
                className="font-body text-sm px-3 py-3 select-none border-r"
                style={{ color: '#8C7B75', borderColor: '#E2D8D0', backgroundColor: '#FFF5F0' }}
              >
                +91
              </span>
              <input
                id="phone"
                data-testid="phone-input"
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                required
                className="flex-1 font-body text-sm px-3 py-3 bg-transparent outline-none"
                style={{ color: '#4A3A35' }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="font-body text-xs font-semibold mb-1 block"
              style={{ color: '#4A3A35' }}
            >
              Password
            </label>
            <div
              className="flex items-center rounded-xl border overflow-hidden"
              style={{ borderColor: '#E2D8D0', backgroundColor: '#FFF5F0' }}
            >
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="flex-1 font-body text-sm px-3 py-3 bg-transparent outline-none"
                style={{ color: '#4A3A35' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="px-3 py-3 flex items-center justify-center focus:outline-none"
                style={{ color: '#8C7B75' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            data-testid="login-btn"
            type="submit"
            disabled={loading}
            className="w-full font-body font-semibold text-sm text-white rounded-full py-3 mt-2 flex items-center justify-center gap-2 transition-opacity"
            style={{ backgroundColor: '#C05621', opacity: loading ? 0.75 : 1 }}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              'Login / Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
