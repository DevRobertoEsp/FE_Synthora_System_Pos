import { useEffect, useState } from 'react'
import api from '../api/axios'

import useToastStore from '../store/toastStore'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', available: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { addToast } = useToastStore()

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products')
      setProducts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '', price: '', available: true })
    setError('')
    setShowForm(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      available: product.available,
    })
    setError('')
    setShowForm(true)
  }

  const handleSave = async () => {
  if (!form.name || !form.price) {
    setError('Nombre y precio son obligatorios')
    return
  }
  setSaving(true)
  try {
    if (editing) {
      await api.put(`/products/${editing.id}`, form)
      addToast('Producto actualizado correctamente', 'success')
    } else {
      await api.post('/products', form)
      addToast('Producto creado correctamente', 'success')
    }
    setShowForm(false)
    fetchProducts()
  } catch (err) {
    addToast('Error al guardar el producto', 'error')
    setError('Error al guardar el producto')
  } finally {
    setSaving(false)
  }
}

const handleDelete = async (id) => {
  if (!confirm('¿Eliminar este producto?')) return
  try {
    await api.delete(`/products/${id}`)
    addToast('Producto eliminado', 'info')
    fetchProducts()
  } catch (err) {
    addToast('Error al eliminar el producto', 'error')
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
        <h1 className="text-2xl font-serif text-white">Productos</h1>
        <button
          onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold px-4 py-2 rounded-lg transition"
        >
          + Agregar
        </button>
      </div>

      {/* Grid de productos */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">
          No hay productos aún. ¡Agrega el primero!
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map(product => (
            <div
              key={product.id}
              className="bg-[#111620] border border-[#1c2130] rounded-xl overflow-hidden hover:border-[#242d42] transition"
            >
              {/* Emoji placeholder */}
              <div className="h-24 bg-gradient-to-br from-[#1a1f2e] to-[#0d1220] flex items-center justify-center text-4xl border-b border-[#1c2130]">
                🍽️
              </div>
              <div className="p-3">
                <div className="font-semibold text-sm text-white mb-1 truncate">{product.name}</div>
                <div className="text-xs text-gray-500 mb-2 line-clamp-2 min-h-[2rem]">
                  {product.description || 'Sin descripción'}
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-serif text-amber-500 text-lg">${product.price}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                    product.available
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {product.available ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(product)}
                    className="flex-1 text-xs bg-[#0d1017] hover:bg-[#1c2130] text-gray-300 py-1.5 rounded-lg transition border border-[#1c2130]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 py-1.5 rounded-lg transition border border-red-500/20"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL — crear / editar */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111620] border border-[#242d42] rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-serif text-xl text-white mb-5">
              {editing ? 'Editar producto' : 'Nuevo producto'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Nombre</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Pizza Margarita"
                  className="w-full bg-[#0d1017] border border-[#242d42] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Tomate, mozzarella, albahaca..."
                  rows={2}
                  className="w-full bg-[#0d1017] border border-[#242d42] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">Precio</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  placeholder="12.99"
                  className="w-full bg-[#0d1017] border border-[#242d42] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="available"
                  checked={form.available}
                  onChange={e => setForm({ ...form, available: e.target.checked })}
                  className="w-4 h-4 accent-amber-500"
                />
                <label htmlFor="available" className="text-sm text-gray-300">Disponible</label>
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
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}