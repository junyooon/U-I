import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../api/client'
import { useAuthStore } from '../store/auth'

interface LoginResponse {
  access_token: string
  user: { id: string; name: string; email: string }
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register'
      const body = mode === 'login' ? { email, password } : { name, email, password }

      if (mode === 'register') {
        await apiPost(path, body)
        // After register, log in automatically
        const data = await apiPost<LoginResponse>('/auth/login', { email, password })
        setAuth(data.access_token, data.user)
      } else {
        const data = await apiPost<LoginResponse>(path, body)
        setAuth(data.access_token, data.user)
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 40%, #1a2040 0%, #0a0f1e 40%, #050810 70%, #010208 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '360px',
        padding: '40px',
        background: 'rgba(10,12,24,0.9)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        backdropFilter: 'blur(12px)',
      }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '4px', color: '#fff' }}>U&amp;I</h1>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '32px' }}>Your world of connections</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={inputStyle}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          {error && <p style={{ fontSize: '13px', color: '#f87171' }}>{error}</p>}
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '13px' }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '11px 14px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
}

const buttonStyle: React.CSSProperties = {
  padding: '11px',
  borderRadius: '8px',
  border: 'none',
  background: '#3b82f6',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: '4px',
}
