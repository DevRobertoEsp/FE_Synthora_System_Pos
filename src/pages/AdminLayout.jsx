import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

//Animaciones

import { Toast } from '../components/Toast'
import useToastStore from '../store/toastStore'

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { toasts, removeToast } = useToastStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/admin/orders',    icon: '🧾', label: 'Pedidos' },
    { to: '/admin/tables',    icon: '🪑', label: 'Mesas' },
    { to: '/admin/products',  icon: '🍽️', label: 'Productos' },
    { to: '/admin/users', icon: '👥', label: 'Usuarios' },
  ]

  return (
    <div className="flex min-h-screen bg-[#080a0f] text-white">

      {/* SIDEBAR — solo desktop */}
      <aside className="hidden md:flex w-56 bg-[#0d1017] border-r border-[#1c2130] flex-col">
        {/* Brand */}
        <div className="flex items-center gap-2 px-4 py-5 border-b border-[#1c2130]">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg flex items-center justify-center text-sm">🍴</div>
          <span className="font-serif text-lg">Syn<span className="text-amber-500">thora</span></span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition
                ${isActive
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Restaurant info + logout */}
        <div className="p-3 border-t border-[#1c2130]">
          <div className="bg-[#111620] border border-[#242d42] rounded-lg p-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold">Restaurante #{user?.restaurantId}</div>
                <div className="text-xs text-gray-500 font-mono">{user?.role}</div>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-xs text-gray-500 hover:text-red-400 transition py-1"
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Topbar mobile */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0d1017] border-b border-[#1c2130]">
          <span className="font-serif text-xl">Syn<span className="text-amber-500">thora</span></span>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
            {user?.email?.[0]?.toUpperCase()}
          </div>
        </header>

        {/* Contenido de cada página */}
        <main className="flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* BOTTOM NAV — solo mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0d1017] border-t border-[#1c2130] flex z-50">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-mono transition
              ${isActive ? 'text-amber-500' : 'text-gray-500'}`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[0.6rem] tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>

        <Toast toasts={toasts} removeToast={removeToast} />

    </div>
  )
}