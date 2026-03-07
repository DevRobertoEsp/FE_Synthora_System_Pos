import { useEffect, useState } from 'react'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import useToastStore from '../store/toastStore'

export default function Users() {
  const { user } = useAuthStore()
  const { addToast } = useToastStore()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ email: '', username: '', password: '', role: 'STAFF' })
  const [error, setError] = useState('')

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users')
      setUsers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.username) {
      setError('Todos los campos son obligatorios')
      return
    }
    setSaving(true)
    try {
      await api.post('/auth/register', {
        ...form,
        restaurantId: user.restaurantId,
      })
      addToast('Usuario creado correctamente', 'success')
      setShowForm(false)
      setForm({ email: '', username: '', password: '', role: 'STAFF' })
      setError('')
      fetchUsers()
    } catch (err) {
      setError('Error al crear el usuario — el email ya existe')
      addToast('Error al crear el usuario', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return
    try {
      await api.delete(`/users/${id}`)
      addToast('Usuario eliminado', 'info')
      fetchUsers()
    } catch (err) {
      addToast('Error al eliminar', 'error')
    }
  }

  const ROLE_STYLE = {
    SUPER_ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    ADMIN:       'bg-amber-500/10 text-amber-400 border-amber-500/20',
    STAFF:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-amber-500 font-mono text-sm animate-pulse">Cargando...</div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-white">Usuarios</h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{users.length} usuarios registrados</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold px-4 py-2 rounded-lg transition"
        >
          + Nuevo usuario
        </button>
      </div>

      {/* Lista */}
      {users.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">
          No hay usuarios aún
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <div
              key={u.id}
              className="bg-[#111620] border border-[#1c2130] rounded-xl p-4 flex items-center justify-between gap-3 hover:border-[#242d42] transition"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-blue-500/20 border border-[#242d42] flex items-center justify-center font-semibold text-white text-sm shrink-0">
                  {u.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="text-sm text-white font-medium">{u.username}</div>
                  <div className="text-xs text-gray-500 font-mono">{u.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono px-2 py-0.5 rounded border hidden sm:inline ${ROLE_STYLE[u.role] || 'bg-gray-500/10 text-gray-400'}`}>
                  {u.role}
                </span>

                {/* No mostrar eliminar si es el mismo usuario logueado */}
                {u.email !== user?.email && (
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg transition"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL nuevo usuario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111620] border border-[#242d42] rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-serif text-xl text-white mb-5">Nuevo usuario</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Nombre</label>
                <input
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="Juan Pérez"
                  className="w-full bg-[#0d1017] border border-[#242d42] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="juan@restaurante.com"
                  className="w-full bg-[#0d1017] border border-[#242d42] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Contraseña</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[#0d1017] border border-[#242d42] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition"
                />
              </div>
             
            </div>

            {error && (
              <p className="text-red-400 text-xs mt-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )} 

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowForm(false); setError('') }}
                className="flex-1 text-sm bg-[#0d1017] text-gray-300 py-2.5 rounded-lg border border-[#1c2130]"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 text-sm bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}