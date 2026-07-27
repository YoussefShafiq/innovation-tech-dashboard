import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import TeamMembersDataTable from '../DataTables/TeamMembersDataTable'
import { TEAM_API, authHeaders } from '../../constants/urls.js'

function normalizeList(res) {
  const raw = res?.data?.data
  return Array.isArray(raw) ? raw : []
}

export default function TeamMembers() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: membersRes, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => axios.get(TEAM_API.list, { headers: authHeaders() }),
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
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('team.title')}</h1>
      <p className="text-gray-600 mb-8 text-sm max-w-2xl">{t('team.subtitle')}</p>
      <TeamMembersDataTable members={normalizeList(membersRes)} loading={isLoading} refetch={refetch} />
    </div>
  )
}
