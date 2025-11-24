import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { apiService } from '@/services/api'

const ConsentBanner: React.FC = () => {
  const { user } = useAuthStore()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      try {
        const r: any = await apiService.getConsents(user.id)
        const accepted = !!r.data?.privacyAccepted && !!r.data?.termsAccepted
        setVisible(!accepted)
      } catch {
        setVisible(true)
      }
    }
    load()
  }, [user?.id])

  if (!visible) return null

  const acceptAll = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      await apiService.setConsents({ userId: user.id, privacyAccepted: true, termsAccepted: true, dataSharing: false, version: 'v1' })
      setVisible(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 shadow-xl rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-gray-800">
          Este aplicativo utiliza seus dados pessoais para oferecer funcionalidades de saúde.
          Ao continuar, você confirma que leu e aceita a Política de Privacidade e os Termos de Uso.
        </div>
        <div className="flex items-center gap-2">
          <a href="#" className="text-sm text-blue-600 hover:text-blue-700">Política de Privacidade</a>
          <a href="#" className="text-sm text-blue-600 hover:text-blue-700">Termos de Uso</a>
          <button disabled={loading} onClick={acceptAll} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            Aceitar e continuar
          </button>
          <button onClick={() => setVisible(false)} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConsentBanner