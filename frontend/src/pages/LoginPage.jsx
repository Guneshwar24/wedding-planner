import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }
    setLoading(true)
    try {
      await login(phone, password)
      navigate('/')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #FFF5F0 50%, #FDFBF7 100%)' }}
    >
      {/* Decorative top element */}
      <div className="absolute top-0 left-0 right-0 h-2" style={{ background: 'linear-gradient(90deg, #C05621, #D69E2E, #C05621)' }} />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: 'linear-gradient(135deg, #C05621, #D69E2E)' }}
          >
            <span className="text-2xl">💍</span>
          </div>
          <h1
            className="text-4xl font-bold mb-2"
            style={{ fontFamily: 'Playfair Display, serif', color: '#C05621' }}
          >
            Shaadi Brain
          </h1>
          <p className="text-sm" style={{ color: '#8C7B75', fontFamily: 'Manrope, sans-serif' }}>
            Your wedding planning companion
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-lg"
          style={{ background: '#FFFFFF', border: '1px solid #E2D8D0' }}
        >
          <h2
            className="text-xl font-semibold mb-6"
            style={{ fontFamily: 'Playfair Display, serif', color: '#4A3A35' }}
          >
            Welcome back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#4A3A35' }}>
                Phone Number
              </label>
              <div className="flex">
                <span
                  className="inline-flex items-center px-3 rounded-l-xl border border-r-0 text-sm font-medium"
                  style={{ background: '#FFF5F0', borderColor: '#E2D8D0', color: '#8C7B75' }}
                >
                  +91
                </span>
                <input
                  type="tel"
                  data-testid="phone-input"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  required
                  className="flex-1 px-4 py-3 rounded-r-xl border outline-none text-sm transition-colors"
                  style={{
                    borderColor: '#E2D8D0',
                    color: '#4A3A35',
                    fontFamily: 'Manrope, sans-serif',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#C05621')}
                  onBlur={e => (e.target.style.borderColor = '#E2D8D0')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#4A3A35' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 rounded-xl border outline-none text-sm transition-colors"
                style={{ borderColor: '#E2D8D0', color: '#4A3A35', fontFamily: 'Manrope, sans-serif' }}
                onFocus={e => (e.target.style.borderColor = '#C05621')}
                onBlur={e => (e.target.style.borderColor = '#E2D8D0')}
              />
            </div>

            <button
              type="submit"
              data-testid="login-btn"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 mt-2"
              style={{
                background: loading ? '#E2D8D0' : 'linear-gradient(135deg, #C05621, #9C4215)',
                fontFamily: 'Manrope, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: '#8C7B75' }}>
          Made with ❤️ for your special day
        </p>
      </div>

      {/* Decorative bottom element */}
      <div className="absolute bottom-0 left-0 right-0 h-2" style={{ background: 'linear-gradient(90deg, #D69E2E, #C05621, #D69E2E)' }} />
    </div>
  )
}
