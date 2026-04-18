import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import ServicesDataTable from '../DataTables/ServicesDataTable'
import { SERVICES, authHeaders } from '../../constants/urls.js'

/** GET /api/admin/services — `data` is the services array */
function normalizeServicesList(res) {
  const raw = res?.data?.data
  return Array.isArray(raw) ? raw : []
}

export default function Services() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: servicesRes, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['services'],
    queryFn: () => axios.get(SERVICES.list, { headers: authHeaders() }),
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
      <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('services.title')}</h1>
      <ServicesDataTable
        services={normalizeServicesList(servicesRes)}
        loading={isLoading}
        refetch={refetch}
      />
    </div>
  )
}
