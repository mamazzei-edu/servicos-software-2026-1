import { useState, useRef } from 'react'

const API_URL = 'http://localhost:8000'

const CLASS_COLORS = {
  cardboard: 'bg-amber-400',
  glass:     'bg-blue-400',
  metal:     'bg-slate-400',
  paper:     'bg-yellow-400',
  plastic:   'bg-red-400',
  trash:     'bg-gray-400',
}

export default function Classificador() {
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)
  const inputRef = useRef()

  function handleFile(f) {
    if (!f || !f.type.startsWith('image/')) return
    setFile(f)
    setResult(null)
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  async function classify() {
    if (!file) return
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const resp = await fetch(`${API_URL}/classificar`, { method: 'POST', body: formData })
      const data = await resp.json()
      if (!resp.ok || data.erro) throw new Error(data.erro || 'Erro desconhecido')
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Upload */}
      <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
        <div
          className="border-2 border-dashed border-teal-300 rounded-2xl p-10 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
        >
          {preview ? (
            <>
              <img src={preview} className="max-h-44 mx-auto rounded-xl shadow mb-3 object-contain" />
              <p className="text-gray-400 text-xs">Clique para trocar</p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-3">📂</div>
              <p className="text-gray-600 font-medium mb-1">Arraste uma imagem aqui</p>
              <p className="text-gray-400 text-sm mb-4">ou clique para selecionar</p>
              <span className="bg-teal-500 text-white text-sm px-5 py-2 rounded-full">Selecionar imagem</span>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {file && !loading && (
          <div className="mt-5 text-center">
            <button
              onClick={classify}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-10 py-3 rounded-full text-lg transition shadow-md active:scale-95"
            >
              Analisar imagem
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center mb-6 fade-in">
          <div className="text-5xl mb-3 animate-spin inline-block">⚙️</div>
          <p className="text-gray-600 font-medium">Analisando...</p>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center mb-6 fade-in">
          <div className="text-4xl mb-2">❌</div>
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={reset} className="mt-3 text-sm text-red-400 underline">Tentar novamente</button>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="fade-in">
          {/* Card principal */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-5 text-center">
            <div className="text-7xl mb-3">{result.emoji}</div>
            <h2 className="text-3xl font-extrabold text-gray-800 mb-1">{result.label}</h2>
            <p className="text-gray-400 text-sm mb-4">{result.lixeira}</p>

            {/* Barra de confiança */}
            <div className="max-w-xs mx-auto mb-5">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Confiança</span>
                <span className="text-teal-600 font-bold">{Math.round(result.confianca * 100)}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bar-fill bg-teal-500 h-3 rounded-full"
                  style={{ width: `${Math.round(result.confianca * 100)}%` }}
                />
              </div>
            </div>

            {result.reciclavel ? (
              <span className="inline-block bg-teal-500 text-white px-5 py-2 rounded-full text-sm font-semibold">♻️ Reciclável</span>
            ) : (
              <span className="inline-block bg-gray-500 text-white px-5 py-2 rounded-full text-sm font-semibold">🚫 Não Reciclável</span>
            )}
          </div>

          {/* Probabilidades */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-5">
            <h3 className="text-base font-bold text-gray-700 mb-4">Probabilidades por categoria</h3>
            <div className="space-y-3">
              {Object.entries(result.todas_classes)
                .sort((a, b) => b[1].probabilidade - a[1].probabilidade)
                .map(([cls, info]) => {
                  const pct = Math.round(info.probabilidade * 100)
                  const isTop = cls === result.classe
                  const barColor = CLASS_COLORS[cls] || 'bg-teal-400'
                  return (
                    <div key={cls} className="flex items-center gap-3">
                      <span className="text-xl w-7 text-center">{info.emoji}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className={isTop ? 'font-bold text-gray-800' : 'text-gray-500'}>{info.label}</span>
                          <span className={isTop ? 'font-bold text-gray-700' : 'text-gray-400'}>{pct}%</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`bar-fill h-2 rounded-full ${isTop ? barColor : 'bg-gray-300'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          <div className="text-center">
            <button onClick={reset} className="text-teal-600 hover:text-teal-800 text-sm underline underline-offset-2">
              ← Analisar outra imagem
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
