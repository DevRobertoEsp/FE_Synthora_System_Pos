import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

const PERIODS = [
  { label: 'Hoy',    value: 'today' },
  { label: 'Semana', value: 'week' },
  { label: 'Mes',    value: 'month' },
  { label: 'Rango',  value: 'range' },
]

function getRange(period) {
  const now = new Date()
  const start = new Date()
  if (period === 'today') {
    start.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    start.setDate(now.getDate() - 6)
    start.setHours(0, 0, 0, 0)
  } else if (period === 'month') {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  }
  return { start, end: now }
}

function formatDate(date) {
  return date.toLocaleDateString('es', { day: '2-digit', month: '2-digit' })
}

function getDaysBetween(start, end) {
  const days = []
  const cur = new Date(start)
  while (cur <= end) {
    days.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111620] border border-[#242d42] rounded-xl px-4 py-3 text-xs">
        <p className="text-gray-400 font-mono mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.name === 'Ventas' ? '$' : ''}{Number(p.value).toFixed(2)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)

  const [period, setPeriod] = useState('week')
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, productsRes, tablesRes] = await Promise.all([
          api.get('/orders'),
          api.get('/products'),
          api.get('/tables'),
        ])
        setOrders(ordersRes.data)
        setProducts(productsRes.data)
        setTables(tablesRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // ── Filtrar pedidos por período ──
  const getFilteredOrders = () => {
    let start, end

    if (period === 'range') {
      if (!rangeStart || !rangeEnd) return []
      start = new Date(rangeStart)
      start.setHours(0, 0, 0, 0)
      end = new Date(rangeEnd)
      end.setHours(23, 59, 59, 999)
    } else {
      const range = getRange(period)
      start = range.start
      end = range.end
    }

    return orders.filter(o => {
      if (!o.createdAt) return false
      const d = new Date(o.createdAt)
      return d >= start && d <= end
    })
  }

  const filteredOrders = getFilteredOrders()
  const paidOrders = filteredOrders.filter(o => o.status === 'PAID')
  const totalSales = paidOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
  const activeOrders = filteredOrders.filter(o => o.status === 'OPEN' || o.status === 'IN_PROGRESS').length
  const cancelledOrders = filteredOrders.filter(o => o.status === 'CANCELLED').length

  // ── Datos para gráfica de ventas por día ──
  const getSalesChartData = () => {
    let start, end

    if (period === 'range' && rangeStart && rangeEnd) {
      start = new Date(rangeStart)
      start.setHours(0, 0, 0, 0)
      end = new Date(rangeEnd)
      end.setHours(23, 59, 59, 999)
    } else if (period !== 'range') {
      const range = getRange(period)
      start = range.start
      end = range.end
    } else {
      return []
    }

    const days = getDaysBetween(start, end)
    return days.map(day => {
      const dayStr = formatDate(day)
      const dayOrders = orders.filter(o => {
        if (!o.createdAt || o.status !== 'PAID') return false
        const d = new Date(o.createdAt)
        return formatDate(d) === dayStr
      })
      const ventas = dayOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
      return { dia: dayStr, Ventas: parseFloat(ventas.toFixed(2)) }
    })
  }

  // ── Datos para gráfica de productos más vendidos ──
  const getTopProducts = () => {
    const counts = {}
    orders
      .filter(o => o.status === 'PAID' && o.items)
      .forEach(o => {
        o.items?.forEach(item => {
          const name = item.product?.name || 'Desconocido'
          counts[name] = (counts[name] || 0) + (item.quantity || 1)
        })
      })
    return Object.entries(counts)
      .map(([name, cantidad]) => ({ name: name.length > 12 ? name.slice(0, 12) + '…' : name, Cantidad: cantidad }))
      .sort((a, b) => b.Cantidad - a.Cantidad)
      .slice(0, 6)
  }

  const salesData = getSalesChartData()
  const topProducts = getTopProducts()

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-amber-500 font-mono text-sm animate-pulse">Cargando...</div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-white">Dashboard</h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">Restaurante #{user?.restaurantId}</p>
        </div>
        <button
          onClick={() => navigate('/admin/orders')}
          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold px-4 py-2 rounded-lg transition"
        >
          + Nuevo pedido
        </button>
      </div>

      {/* Selector de período */}
      <div className="bg-[#111620] border border-[#1c2130] rounded-xl p-4">
        <div className="flex gap-2 flex-wrap mb-3">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`text-xs font-mono px-4 py-1.5 rounded-full border transition
                ${period === p.value
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'text-gray-500 border-[#1c2130] hover:text-white'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Selector de rango */}
        {period === 'range' && (
          <div className="flex gap-3 items-center flex-wrap">
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1">Desde</label>
              <input
                type="date"
                value={rangeStart}
                onChange={e => setRangeStart(e.target.value)}
                className="bg-[#0d1017] border border-[#242d42] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-amber-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1">Hasta</label>
              <input
                type="date"
                value={rangeEnd}
                onChange={e => setRangeEnd(e.target.value)}
                className="bg-[#0d1017] border border-[#242d42] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#111620] border border-[#1c2130] border-t-2 border-t-amber-500 rounded-xl p-4">
          <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Ventas</div>
          <div className="font-serif text-2xl text-white">${totalSales.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">{paidOrders.length} cobrados</div>
        </div>
        <div className="bg-[#111620] border border-[#1c2130] border-t-2 border-t-blue-500 rounded-xl p-4">
          <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Pedidos</div>
          <div className="font-serif text-2xl text-white">{filteredOrders.length}</div>
          <div className="text-xs text-gray-500 mt-1">{activeOrders} activos</div>
        </div>
        <div className="bg-[#111620] border border-[#1c2130] border-t-2 border-t-emerald-500 rounded-xl p-4">
          <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Mesas</div>
          <div className="font-serif text-2xl text-white">{tables.filter(t => t.active).length}/{tables.length}</div>
          <div className="text-xs text-gray-500 mt-1">activas</div>
        </div>
        <div className="bg-[#111620] border border-[#1c2130] border-t-2 border-t-red-500 rounded-xl p-4">
          <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Cancelados</div>
          <div className="font-serif text-2xl text-white">{cancelledOrders}</div>
          <div className="text-xs text-gray-500 mt-1">en el período</div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Ventas por día */}
        <div className="bg-[#111620] border border-[#1c2130] rounded-xl p-4">
          <h3 className="text-sm font-serif text-white mb-4">Ventas por día</h3>
          {salesData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
              {period === 'range' && (!rangeStart || !rangeEnd)
                ? 'Selecciona un rango de fechas'
                : 'Sin datos en este período'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e8a435" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#e8a435" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2130" />
                <XAxis dataKey="dia" tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Ventas"
                  stroke="#e8a435"
                  strokeWidth={2}
                  fill="url(#colorVentas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Productos más vendidos */}
        <div className="bg-[#111620] border border-[#1c2130] rounded-xl p-4">
          <h3 className="text-sm font-serif text-white mb-4">Productos más vendidos</h3>
          {topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
              Sin datos aún
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2130" />
                <XAxis dataKey="name" tick={{ fill: '#5a6478', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Cantidad" fill="#3d7fff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pedidos recientes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg text-white">Pedidos recientes</h2>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-xs text-gray-400 hover:text-amber-500 transition font-mono"
          >
            Ver todos →
          </button>
        </div>
        <div className="bg-[#111620] border border-[#1c2130] rounded-xl overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No hay pedidos en este período</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1c2130] bg-[#0d1017]">
                    <th className="text-left px-4 py-3 text-xs font-mono text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-mono text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-mono text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-mono text-gray-500 uppercase tracking-wider hidden md:table-cell">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.slice(0, 8).map(order => (
                    <tr key={order.id} className="border-b border-[#1c2130] hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-sm text-gray-300 font-mono">#{order.id}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                          {
                            OPEN:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
                            IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                            READY:       'bg-purple-500/10 text-purple-400 border-purple-500/20',
                            PAID:        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                            CANCELLED:   'bg-red-500/10 text-red-400 border-red-500/20',
                          }[order.status]
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-amber-400 font-mono">
                        {order.total ? `$${parseFloat(order.total).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell font-mono">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}