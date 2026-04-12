import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Classificador from './pages/Classificador'
import Historico from './pages/Historico'

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-emerald-100">
      <Navbar />
      <Routes>
        <Route path="/" element={<Classificador />} />
        <Route path="/historico" element={<Historico />} />
      </Routes>
    </div>
  )
}
