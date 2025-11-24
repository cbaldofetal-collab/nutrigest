import React, { useEffect, useMemo, useState } from 'react'
import { apiService } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'

const fmtDate = (d: Date) => d.toISOString().slice(0, 10)
const fmtTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

const NutritionPage: React.FC = () => {
  const user = useAuthStore((s) => s.user)
  const [date, setDate] = useState(fmtDate(new Date()))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null)
  const [servings, setServings] = useState<number>(1)

  const [hydrMl, setHydrMl] = useState<number>(250)

  const [summary, setSummary] = useState<any | null>(null)
  const [hydration, setHydration] = useState<any | null>(null)
  const [adequacao, setAdequacao] = useState<any | null>(null)

  const timeNow = useMemo(() => fmtTime(new Date()), [])

  const loadSummary = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const res: any = await apiService.getDailySummary(user.id, date)
      setSummary(res.data.summary)
      setHydration(res.data.hydration)
      setAdequacao(res.data.adequacao)
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar resumo diário')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [date])

  const onSearch = async () => {
    if (!search.trim()) return
    setError(null)
    try {
      const res: any = await apiService.searchFoodItems(search, 10)
      setResults(res.data || [])
    } catch (e: any) {
      setError(e.message || 'Erro na busca de alimentos')
    }
  }

  const onSeed = async () => {
    setError(null)
    try {
      await apiService.seedFoodItems()
      if (search.trim()) await onSearch()
      await loadSummary()
    } catch (e: any) {
      setError(e.message || 'Erro ao popular amostras')
    }
  }

  const onAddMeal = async () => {
    if (!user || !selectedFoodId) return
    setError(null)
    try {
      await apiService.createMeal({
        usuario_id: user.id,
        entries: [{ food_id: selectedFoodId, quantity_servings: servings }],
        data_refeicao: date,
        hora_refeicao: timeNow,
      })
      setServings(1)
      setSelectedFoodId(null)
      await loadSummary()
    } catch (e: any) {
      setError(e.message || 'Erro ao registrar refeição')
    }
  }

  const onAddHydration = async () => {
    if (!user) return
    setError(null)
    try {
      await apiService.createHydration({
        usuario_id: user.id,
        volume_ml: hydrMl,
        data_registro: date,
        hora_registro: timeNow,
      })
      setHydrMl(250)
      await loadSummary()
    } catch (e: any) {
      setError(e.message || 'Erro ao registrar hidratação')
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Nutrição diária</h1>
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm">Data</label>
        <input type="date" className="border rounded px-2 py-1" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {error && <div className="text-red-600 mb-3">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-3">
          <h2 className="font-medium mb-2">Registrar refeição</h2>
          <div className="flex gap-2 mb-2">
            <input className="border rounded px-2 py-1 flex-1" placeholder="Buscar alimento" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="bg-blue-600 text-white rounded px-3 py-1" onClick={onSearch}>Buscar</button>
            {import.meta.env.MODE !== 'production' && (
              <button className="bg-gray-700 text-white rounded px-3 py-1" onClick={onSeed}>Amostras</button>
            )}
          </div>
          <div className="max-h-32 overflow-auto mb-2 border rounded">
            {results.map((r) => (
              <button key={r.id} className={`w-full text-left px-2 py-1 ${selectedFoodId === r.id ? 'bg-blue-50' : ''}`} onClick={() => setSelectedFoodId(r.id)}>
                {r.nome} <span className="text-xs text-gray-500">{r.serving_size_g} g</span>
              </button>
            ))}
            {results.length === 0 && <div className="px-2 py-1 text-sm text-gray-500">Nenhum resultado</div>}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Porções</label>
            <input type="number" min={0.25} step={0.25} className="border rounded px-2 py-1 w-24" value={servings} onChange={(e) => setServings(parseFloat(e.target.value))} />
            <button className="bg-green-600 text-white rounded px-3 py-1" onClick={onAddMeal} disabled={!selectedFoodId}>Adicionar</button>
          </div>
        </div>

        <div className="border rounded p-3">
          <h2 className="font-medium mb-2">Hidratação</h2>
          <div className="flex items-center gap-2">
            <input type="number" min={50} step={50} className="border rounded px-2 py-1 w-28" value={hydrMl} onChange={(e) => setHydrMl(parseInt(e.target.value) || 0)} />
            <span className="text-sm">ml</span>
            <button className="bg-teal-600 text-white rounded px-3 py-1" onClick={onAddHydration}>Registrar</button>
          </div>
          <div className="text-sm text-gray-600 mt-2">Total do dia: {hydration?.total_ml ?? 0} ml</div>
        </div>
      </div>

      <div className="border rounded p-3 mt-6">
        <h2 className="font-medium mb-3">Resumo diário</h2>
        {loading && <div>Carregando...</div>}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm">Energia: {Math.round(summary.energia_kcal || 0)} kcal</div>
              <div className="text-sm">Proteína: {Number(summary.proteina_g || 0).toFixed(1)} g</div>
              <div className="text-sm">Gordura: {Number(summary.gordura_g || 0).toFixed(1)} g</div>
              <div className="text-sm">Carboidrato: {Number(summary.carboidrato_g || 0).toFixed(1)} g</div>
            </div>
            <div>
              <Adequacy label="Ferro" value={adequacao?.ferro ?? 0} />
              <Adequacy label="Folato" value={adequacao?.folato ?? 0} />
              <Adequacy label="Cálcio" value={adequacao?.calcio ?? 0} />
              <Adequacy label="Hidratação" value={adequacao?.hidratacao ?? 0} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const Adequacy: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded">
        <div className="h-2 bg-green-600 rounded" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  )
}

export default NutritionPage