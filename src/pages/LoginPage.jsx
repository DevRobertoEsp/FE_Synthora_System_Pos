import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data } = await api.post('/auth/login', form)

      // Guardamos token y datos del usuario
      login(data.token, {
        email: form.email,
        role: data.role,
        restaurantId: data.restaurantId,
      })

      // Redirigir según el rol
      if (data.role === 'ADMIN' || data.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard')
      } else {
        navigate('/waiter/orders')
      }

    } catch (err) {
      setError('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080a0f] flex">
      {/* LEFT — solo desktop */}
      <div className="hidden md:flex w-1/2 bg-[#0d1017] border-r border-[#1c2130] flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute w-96 h-96 rounded-full bg-amber-500/5 -top-20 -left-20" />
        <div className="absolute w-80 h-80 rounded-full bg-blue-500/5 -bottom-20 -right-20" />
        <div className="relative text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6 shadow-lg shadow-amber-500/20">
            🍴
          </div>
          <h1 className="font-serif text-5xl text-white mb-2">
            Syn<span className="text-amber-500">thora</span>
          </h1>
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            La plataforma SaaS para gestionar tu restaurante de forma inteligente
          </p>
          <ul className="mt-10 text-left space-y-2">
            {['Pedidos en tiempo real', 'POS para tu equipo', 'Control de mesas', 'Multi-restaurante'].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RIGHT — formulario */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-16">
        <div className="w-full max-w-sm">
          {/* Logo solo mobile */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center text-sm">🍴</div>
            <span className="font-serif text-2xl text-white">Syn<span className="text-amber-500">thora</span></span>
          </div>

          <h2 className="font-serif text-3xl text-white mb-1">Bienvenido</h2>
          <p className="text-sm text-gray-400 mb-8">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="admin@latrattoria.com"
                className="w-full bg-[#111620] border border-[#242d42] rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition placeholder-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-[#111620] border border-[#242d42] rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition placeholder-gray-600"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg py-3 text-sm transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}