import { useEffect, useState } from 'react'
import api from '../api/axios'

const STATUS_FLOW = {
  OPEN: 'IN_PROGRESS',
  IN_PROGRESS: 'READY',
  READY: 'PAID',
}

const STATUS_LABEL = {
  OPEN: 'Abierto',
  PAID: 'Pagado',
  CANCELLED: 'Cancelado',
}

const STATUS_STYLE = {
  OPEN:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  READY:       'bg-purple-500/10 text-purple-400 border-purple-500/20',
  PAID:        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CANCELLED:   'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [tables, setTables] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  // Flujo nuevo pedido
  const [step, setStep] = useState(0) // 0=cerrado, 1=mesa, 2=productos, 3=confirmar
  const [selectedTable, setSelectedTable] = useState(null)
  const [cart, setCart] = useState([]) // [{ product, quantity, note }]
  const [saving, setSaving] = useState(false)

  // Modal detalle pedido
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [loadingItems, setLoadingItems] = useState(false)

  // flujo Porque cancelaste el pedido? -> opciones: "Cliente se fue", "Error en la cocina", "Otro motivo" + campo de texto

const [showCancelModal, setShowCancelModal] = useState(false)
const [cancelReason, setCancelReason] = useState('')

  const fetchAll = async () => {
    try {
      const [ordersRes, tablesRes, productsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/tables'),
        api.get('/products'),
      ])
      setOrders(ordersRes.data)
      setTables(tablesRes.data)
      setProducts(productsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // ── CARRITO ──
  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.product.id === product.id)
      if (exists) {
        return prev.map(i => i.product.id === product.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
        )
      }
      return [...prev, { product, quantity: 1, note: '' }]
    })
  }

  const updateCartQty = (productId, qty) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.product.id !== productId))
    } else {
      setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i))
    }
  }

  const updateCartNote = (productId, note) => {
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, note } : i))
  }

  const cartTotal = cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0)

  const [search, setSearch] = useState('')

  const resetFlow = () => {
    setStep(0)
    setSelectedTable(null)
    setCart([])
    setSearch('')
  }

  // ── CREAR PEDIDO ──
  const handleCreate = async () => {
    setSaving(true)
    try {
      // 1. Crear el pedido
      const body = selectedTable ? { table: { id: selectedTable.id } } : {}
      const { data: newOrder } = await api.post('/orders', body)

      // 2. Agregar items
      for (const item of cart) {
        await api.post(`/orders/${newOrder.id}/items`, {
          productId: item.product.id,
          quantity: item.quantity,
        })
      }

      resetFlow()
      fetchAll()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // ── DETALLE PEDIDO ──
  const openOrder = async (order) => {
    setSelectedOrder(order)
    setLoadingItems(true)
    try {
      const { data } = await api.get(`/orders/${order.id}/items`)
      setOrderItems(data)
    } catch {
      setOrderItems([])
    } finally {
      setLoadingItems(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus, cancelReason = null) => {
  try {
    await api.patch(`/orders/${orderId}/status`, {
      status: newStatus,
      cancelReason: cancelReason,
    })
    fetchAll()
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus }))
    }
  } catch (err) {
    console.error(err)
  }
}

  const orderTotal = orderItems.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0)
  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-amber-500 font-mono text-sm animate-pulse">Cargando...</div>
    </div>
  )

  return (
    <div className="p-4 md:p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-serif text-white">Pedidos</h1>
        <button
          onClick={() => { fetchAll(); setStep(1) }}
          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold px-4 py-2 rounded-lg transition"
        >
          + Nuevo pedido
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['ALL', 'OPEN', 'PAID', 'CANCELLED'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-mono px-3 py-1.5 rounded-full border transition
              ${filter === s
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'text-gray-500 border-[#1c2130] hover:text-white'
              }`}
          >
            {s === 'ALL' ? 'Todos' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Lista pedidos */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">No hay pedidos aún</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div
              key={order.id}
              onClick={() => openOrder(order)}
              className="bg-[#111620] border border-[#1c2130] rounded-xl p-4 hover:border-amber-500/30 cursor-pointer transition"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-gray-300">#{order.id}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border ${STATUS_STYLE[order.status]}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-mono">
                  {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                </span>
              </div>
              {STATUS_FLOW[order.status] && (
                <div className="mt-3 pt-3 border-t border-[#1c2130]">
                  <p>Pedido Registrado</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════
          MODAL NUEVO PEDIDO — 3 pasos
      ══════════════════════════════════ */}
      {step > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-[#111620] border border-[#242d42] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

            {/* Header con pasos */}
            <div className="p-5 border-b border-[#1c2130]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-xl text-white">Nuevo pedido</h2>
                <button onClick={resetFlow} className="text-gray-500 hover:text-white transition text-xl">✕</button>
              </div>
              {/* Indicador de pasos */}
              <div className="flex items-center gap-2">
                {[1, 2, 3].map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono transition
                      ${step >= s ? 'bg-amber-500 text-black' : 'bg-[#1c2130] text-gray-500'}`}>
                      {s}
                    </div>
                    <span className={`text-xs font-mono hidden sm:block ${step >= s ? 'text-amber-400' : 'text-gray-600'}`}>
                      {s === 1 ? 'Mesa' : s === 2 ? 'Productos' : 'Confirmar'}
                    </span>
                    {s < 3 && <div className={`h-px w-6 ${step > s ? 'bg-amber-500' : 'bg-[#1c2130]'}`} />}
                  </div>
                ))}
              </div>
            </div>

           {/* ── Seleccionar mesa ── */}

{step === 1 && (
  <div className="flex-1 overflow-y-auto p-5 pb-24 md:pb-5">
    <p className="text-sm text-gray-400 mb-4">Selecciona una mesa o continúa sin asignar</p>

    <div className="grid grid-cols-3 gap-3 mb-4">
      {tables.filter(t => t.active).map(table => (
        <button
          key={table.id}
          onClick={() => setSelectedTable(table)}
          className={`p-4 rounded-xl border text-center transition
            ${selectedTable?.id === table.id
              ? 'bg-amber-500/15 border-amber-500 text-amber-400'
              : 'bg-[#0d1017] border-[#1c2130] text-gray-300 hover:border-amber-500/40'
            }`}
        >
          <div className="font-serif text-2xl text-white">{table.number}</div>
          <div className="text-xs text-gray-500 mt-1">👥 {table.capacity}</div>
        </button>
      ))}
    </div>

    <div className="flex gap-3">
      <button
        onClick={() => { setSelectedTable(null); setStep(2) }}
        className="flex-1 text-sm bg-[#0d1017] text-gray-300 py-2.5 rounded-lg border border-[#1c2130] hover:bg-[#1c2130] transition"
      >
        Sin mesa
      </button>
      <button
        onClick={() => setStep(2)}
        disabled={!selectedTable}
        className="flex-1 text-sm bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2.5 rounded-lg transition disabled:opacity-40"
      >
        Continuar →
      </button>
    </div>
  </div>
)}

            {/* ── PASO 2: Seleccionar productos ── */}
{step === 2 && (
  <div className="flex-1 overflow-y-auto p-5 pb-24 md:pb-5">
    <p className="text-sm text-gray-400 mb-3">
      {selectedTable ? `Mesa ${selectedTable.number}` : 'Sin mesa'} · Selecciona los productos
    </p>

    {/* Barra de búsqueda */}
    <input
      type="text"
      value={search}
      onChange={e => setSearch(e.target.value)}
      placeholder="🔍 Buscar producto..."
      className="w-full bg-[#0d1017] border border-[#242d42] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition placeholder-gray-600 mb-4"
    />

    <div className="space-y-2 mb-4">
      {products
        .filter(p => p.available && p.name.toLowerCase().includes(search.toLowerCase()))
        .map(product => {
          const inCart = cart.find(i => i.product.id === product.id)
          return (
            <div
              key={product.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition
                ${inCart ? 'border-amber-500/40 bg-amber-500/5' : 'border-[#1c2130] bg-[#0d1017]'}`}
            >
              <div className="flex-1">
                <div className="text-sm text-white font-medium">{product.name}</div>
                <div className="text-xs text-gray-500">{product.description}</div>
                <div className="text-xs text-amber-500 font-mono mt-0.5">${product.price}</div>
              </div>
              {inCart ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCartQty(product.id, inCart.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-[#1c2130] hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition flex items-center justify-center"
                  >−</button>
                  <span className="text-sm font-mono text-white w-5 text-center">{inCart.quantity}</span>
                  <button
                    onClick={() => updateCartQty(product.id, inCart.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-[#1c2130] hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-400 transition flex items-center justify-center"
                  >+</button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(product)}
                  className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg transition"
                >
                  + Agregar
                </button>
              )}
            </div>
          )
        })}
    </div>

    <div className="flex gap-3 pt-3 border-t border-[#1c2130]">
      <button
        onClick={() => setStep(1)}
        className="flex-1 text-sm bg-[#0d1017] text-gray-300 py-2.5 rounded-lg border border-[#1c2130]"
      >
        ← Volver
      </button>
      <button
        onClick={() => setStep(3)}
        disabled={cart.length === 0}
        className="flex-1 text-sm bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2.5 rounded-lg transition disabled:opacity-40"
      >
        Continuar → ({cart.length})
      </button>
    </div>
  </div>
)}

            {/* ── PASO 3: Confirmar + notas ── */}
            {step === 3 && (
              <div className="flex-1 overflow-y-auto p-5 pb-24 md:pb-5" >
                <p className="text-sm text-gray-400 mb-4">Revisa el pedido y agrega notas si es necesario</p>

                <div className="space-y-3 mb-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="bg-[#0d1017] border border-[#1c2130] rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm text-white font-medium">{item.product.name}</span>
                          <span className="text-xs text-gray-500 font-mono ml-2">x{item.quantity}</span>
                        </div>
                        <span className="text-amber-500 font-mono text-sm">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <input
                        value={item.note}
                        onChange={e => updateCartNote(item.product.id, e.target.value)}
                        placeholder="Nota para cocina (sin cebolla, bien cocido...)"
                        className="w-full bg-[#111620] border border-[#242d42] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500 transition placeholder-gray-600"
                      />
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center py-3 border-t border-[#1c2130] mb-4">
                  <span className="text-sm text-gray-400">Total estimado</span>
                  <span className="font-serif text-xl text-amber-500">${cartTotal.toFixed(2)}</span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 text-sm bg-[#0d1017] text-gray-300 py-2.5 rounded-lg border border-[#1c2130]"
                  >
                    ← Volver
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={saving}
                    className="flex-1 text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
                  >
                    {saving ? 'Enviando...' : '✓ Confirmar pedido'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL detalle pedido */}
{selectedOrder && (
  <div className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-50 p-4">
    <div className="bg-[#111620] border border-[#242d42] rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#1c2130]">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-xl text-white">Pedido #{selectedOrder.id}</h2>
            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${STATUS_STYLE[selectedOrder.status]}`}>
              {STATUS_LABEL[selectedOrder.status]}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-mono mt-1">
            {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : ''}
          </p>
        </div>
        <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-white text-xl transition">✕</button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-5 pb-24 md:pb-5">
        {loadingItems ? (
          <div className="text-amber-500 text-xs font-mono animate-pulse">Cargando items...</div>
        ) : orderItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">Sin productos en este pedido</div>
        ) : (
          <div className="space-y-2 mb-4">
            {orderItems.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-[#0d1017] rounded-xl p-3 border border-[#1c2130]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-lg">🍽️</div>
                  <div>
                    <div className="text-sm text-white font-medium">{item.product?.name}</div>
                    <div className="text-xs text-gray-500 font-mono">${item.unitPrice} × {item.quantity}</div>
                  </div>
                </div>
                <span className="text-sm font-mono text-amber-400 font-semibold">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-between items-center py-3 px-1 border-t border-[#242d42] mt-2">
              <span className="text-sm text-gray-400">Total del pedido</span>
              <span className="font-serif text-2xl text-amber-500">${orderTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Aquí va el motivo */}
{selectedOrder.status === 'CANCELLED' && selectedOrder.cancelReason && (
  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 mb-2">
    <p className="text-xs font-mono text-red-400 uppercase tracking-wider mb-1">Motivo de cancelación</p>
    <p className="text-sm text-gray-300">{selectedOrder.cancelReason}</p>
  </div>
)}

        {/* Acciones */}
        <div className="space-y-2 mt-2">

          {/* Botón principal según estado */}
          {selectedOrder.status === 'OPEN' && (
            <button
              onClick={() => handleStatusChange(selectedOrder.id, 'PAID')}
              className="w-full text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              💳 Cobrar pedido
            </button>
          )}

          {selectedOrder.status === 'IN_PROGRESS' && (
            <button
              onClick={() => handleStatusChange(selectedOrder.id, 'READY')}
              className="w-full text-sm bg-purple-500 hover:bg-purple-400 text-white font-semibold py-3 rounded-xl transition"
            >
              ✓ Marcar como listo
            </button>
          )}

          {selectedOrder.status === 'READY' && (
            <button
              onClick={() => handleStatusChange(selectedOrder.id, 'PAID')}
              className="w-full text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              💳 Cobrar pedido
            </button>
          )}


          {/* Cancelar pedido */}
          {(selectedOrder.status === 'OPEN' || selectedOrder.status === 'IN_PROGRESS') && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2.5 rounded-xl transition"
            >
              ✕ Cancelar pedido
            </button>
          )}


{/* MODAL motivo cancelación */}
{showCancelModal && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
    <div className="bg-[#111620] border border-[#242d42] rounded-2xl w-full max-w-sm p-6">
      <h3 className="font-serif text-lg text-white mb-1">¿Por qué cancelás este pedido?</h3>
      <p className="text-xs text-gray-500 font-mono mb-4">El motivo quedará registrado internamente.</p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {['Cliente se fue', 'Error en el pedido', 'Producto no disponible', 'Solicitud del cliente', 'Otro'].map(reason => (
          <button
            key={reason}
            onClick={() => setCancelReason(reason)}
            className={`text-xs px-3 py-2 rounded-lg border transition text-left
              ${cancelReason === reason
                ? 'bg-red-500/15 border-red-500/40 text-red-400'
                : 'bg-[#0d1017] border-[#1c2130] text-gray-400 hover:border-red-500/20'
              }`}
          >
            {reason}
          </button>
        ))}
      </div>

      <textarea
        value={cancelReason}
        onChange={e => setCancelReason(e.target.value)}
        placeholder="O escribe un motivo personalizado..."
        rows={2}
        className="w-full bg-[#0d1017] border border-[#242d42] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500 transition placeholder-gray-600 mb-4 resize-none"
      />

      <div className="flex gap-3">
        <button
          onClick={() => { setShowCancelModal(false); setCancelReason('') }}
          className="flex-1 text-sm bg-[#0d1017] text-gray-300 py-2.5 rounded-lg border border-[#1c2130] hover:bg-[#1c2130] transition"
        >
          Volver
        </button>
        <button
          disabled={!cancelReason.trim()}
          onClick={async () => {
            await handleStatusChange(selectedOrder.id, 'CANCELLED', cancelReason)
            setShowCancelModal(false)
            setCancelReason('')
          }}
          className="flex-1 text-sm bg-red-500 hover:bg-red-400 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-40"
        >
          Confirmar cancelación
        </button>
      </div>
    </div>
  </div>
)}
          

          {/* Eliminar pedido — solo PAID o CANCELLED */}
          {(selectedOrder.status === 'PAID' || selectedOrder.status === 'CANCELLED') && (
            <button
              onClick={async () => {
                if (!confirm('¿Eliminar este pedido?')) return
                try {
                  await api.delete(`/orders/${selectedOrder.id}`)
                  setSelectedOrder(null)
                  fetchAll()
                } catch (err) {
                  console.error(err)
                }
              }}
              className="w-full text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2.5 rounded-xl transition"
            >
              🗑️ Eliminar pedido
            </button>
          )}

        </div>
      </div>

    </div>
  </div>
)}

    </div>
  )
}
