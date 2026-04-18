import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import PartnersDataTable from '../DataTables/PartnersDataTable'
import { PARTNERS_API, authHeaders } from '../../constants/urls.js'

function normalizePartnersList(res) {
  const raw = res?.data?.data
  return Array.isArray(raw) ? raw : []
}

export default function Partners() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: partnersRes, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['partners'],
    queryFn: () => axios.get(PARTNERS_API.list, { headers: authHeaders() }),
  })

  useEffect(() => {
    if (!isError || !error) return
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('userToken')
      navigate('/login')
    }
    if (status === 403) {
      toast.error(t('common.error'))
      navigate('/')
    }
  }, [isError, error, navigate, t])

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('partners.title')}</h1>
      <p className="text-gray-600 mb-8 text-sm max-w-2xl">{t('partners.subtitle')}</p>
      <PartnersDataTable partners={normalizePartnersList(partnersRes)} loading={isLoading} refetch={refetch} />
    </div>
  )
}
