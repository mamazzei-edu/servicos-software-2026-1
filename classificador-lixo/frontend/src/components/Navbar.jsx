import { NavLink } from 'react-router-dom'

export default function Navbar() {
  const link = ({ isActive }) =>
    `px-4 py-2 rounded-full text-sm font-medium transition ${
      isActive
        ? 'bg-teal-600 text-white'
        : 'text-teal-700 hover:bg-teal-100'
    }`

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="text-xl font-extrabold text-teal-700">♻️ Classificador de Lixo</span>
        <div className="flex gap-2">
          <NavLink to="/" end className={link}>Classificador</NavLink>
          <NavLink to="/historico" className={link}>Histórico</NavLink>
        </div>
      </div>
    </nav>
  )
}
