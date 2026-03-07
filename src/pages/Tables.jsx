import { useEffect, useState } from 'react'
import api from '../api/axios'

export default function Tables() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ number: '', capacity: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchTables = async () => {
    try {
      const { data } = await api.get('/tables')
      setTables(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTables() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ number: '', capacity: '' })
    setError('')
    setShowForm(true)
  }

  const openEdit = (table) => {
    setEditing(table)
    setForm({ number: table.number, capacity: table.capacity })
    setError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.number || !form.capacity) {
      setError('Número y capacidad son obligatorios')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/tables/${editing.id}`, form)
      } else {
        await api.post('/tables', form)
      }
      setShowForm(false)
      fetchTables()
    } catch (err) {
      setError('Error al guardar la mesa')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta mesa?')) return
    try {
      await api.delete(`/tables/${id}`)
      fetchTables()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-amber-500 font-mono text-sm animate-pulse">Cargando...</div>
    </div>
  )

  return (
    <div className="p-4 md:p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-white">Mesas</h1>
        <button
          onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold px-4 py-2 rounded-lg transition"
        >
          + Agregar mesa
        </button>
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 mb-4 text-xs font-mono text-gray-400">
        <span><span className="text-emerald-400">●</span> Activa</span>
        <span><span className="text-red-400">●</span> Inactiva</span>
      </div>

      {/* Grid de mesas */}
      {tables.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">
          No hay mesas aún. ¡Agrega la primera!
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {tables.map(table => (
            <div
              key={table.id}
              className={`bg-[#111620] border rounded-xl p-4 text-center transition
                ${table.active
                  ? 'border-emerald-500/30 hover:border-emerald-500/60'
                  : 'border-red-500/20 opacity-60'
                }`}
            >
              <div className="font-serif text-3xl text-white mb-1">{table.number}</div>
              <div className={`text-xs font-mono mb-1 ${table.active ? 'text-emerald-400' : 'text-red-400'}`}>
                {table.active ? 'Activa' : 'Inactiva'}
              </div>
              <div className="text-xs text-gray-500 mb-3">👥 {table.capacity} personas</div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(table)}
                  className="flex-1 text-xs bg-[#0d1017] hover:bg-[#1c2130] text-gray-300 py-1 rounded transition border border-[#1c2130]"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(table.id)}
                  className="flex-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 py-1 rounded transition"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111620] border border-[#242d42] rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-serif text-xl text-white mb-5">
              {editing ? 'Editar mesa' : 'Nueva mesa'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Número de mesa</label>
                <input
                  value={form.number}
                  onChange={e => setForm({ ...form, number: e.target.value })}
                  placeholder="1"
                  className="w-full bg-[#0d1017] border border-[#242d42] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Capacidad</label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={e => setForm({ ...form, capacity: e.target.value })}
                  placeholder="4"
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
                onClick={() => setShowForm(false)}
                className="flex-1 text-sm bg-[#0d1017] hover:bg-[#1c2130] text-gray-300 py-2.5 rounded-lg transition border border-[#1c2130]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 text-sm bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Guardando...' : editing ? 'Guardar' : 'Crear mesa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}