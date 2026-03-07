import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function WaiterLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/waiter/orders',   icon: '🧾', label: 'Pedidos' },
  ]

  return (
    <div className="min-h-screen bg-[#080a0f] text-white flex flex-col">

      {/* TOPBAR */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#0d1017] border-b border-[#1c2130]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg flex items-center justify-center text-xs">🍴</div>
          <span className="font-serif text-lg">Syn<span className="text-amber-500">thora</span></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono hidden sm:block">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-red-400 transition"
          >
            🚪 Salir
          </button>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0d1017] border-t border-[#1c2130] flex z-50">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-xs font-mono transition
              ${isActive ? 'text-amber-500' : 'text-gray-500'}`
            }
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[0.65rem]">{item.label}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  )
}