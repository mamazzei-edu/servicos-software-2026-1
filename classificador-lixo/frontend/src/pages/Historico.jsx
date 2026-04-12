import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:8000'

function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function Historico() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  async function fetchHistorico() {
    setLoading(true)
    try {
      const resp = await fetch(`${API_URL}/historico`)
      const data = await resp.json()
      setItems(data)
    } catch {
      setError('Não foi possível carregar o histórico.')
    } finally {
      setLoading(false)
    }
  }

  async function limpar() {
    if (!confirm('Apagar todo o histórico?')) return
    await fetch(`${API_URL}/historico`, { method: 'DELETE' })
    setItems([])
  }

  useEffect(() => { fetchHistorico() }, [])

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl animate-spin inline-block mb-4">⚙️</div>
      <p className="text-gray-500">Carregando histórico...</p>
    </div>
  )

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-red-500">{error}</p>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-gray-800">
          Histórico
          <span className="ml-2 text-sm font-normal text-gray-400">{items.length} análise{items.length !== 1 ? 's' : ''}</span>
        </h2>
        {items.length > 0 && (
          <button
            onClick={limpar}
            className="text-sm text-red-400 hover:text-red-600 underline underline-offset-2 transition"
          >
            Limpar histórico
          </button>
        )}
      </div>

      {/* Vazio */}
      {items.length === 0 && (
        <div className="bg-white rounded-3xl shadow-lg p-16 text-center fade-in">
          <div className="text-6xl mb-4">🗃️</div>
          <p className="text-gray-500 font-medium">Nenhuma análise ainda.</p>
          <p className="text-gray-400 text-sm mt-1">Vá para a página de Classificador e envie uma imagem.</p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-md overflow-hidden fade-in hover:shadow-lg transition">

            {/* Imagem */}
            <div className="bg-gray-50 h-40 flex items-center justify-center overflow-hidden">
              {item.imagem_b64 ? (
                <img
                  src={`data:image/jpeg;base64,${item.imagem_b64}`}
                  alt={item.label}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-5xl">{item.emoji}</span>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{item.emoji}</span>
                <span className="font-bold text-gray-800 text-lg">{item.label}</span>
              </div>

              {/* Barra de confiança */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Confiança</span>
                  <span className="font-semibold text-teal-600">{Math.round(item.confianca * 100)}%</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bar-fill bg-teal-500 h-2 rounded-full"
                    style={{ width: `${Math.round(item.confianca * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                {item.reciclavel ? (
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-medium">♻️ Reciclável</span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">🚫 Não Reciclável</span>
                )}
                <span className="text-xs text-gray-400">{formatDate(item.criado_em)}</span>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  )
}
