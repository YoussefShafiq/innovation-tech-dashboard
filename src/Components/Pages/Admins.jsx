import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminsDataTable from '../DataTables/AdminsDataTable'
import toast from 'react-hot-toast'
import { USERS, PERMISSIONS_API, authHeaders } from '../../constants/urls.js'

/** GET /api/admin/users — `data` is the user array */
function normalizeUsersList(res) {
  const raw = res?.data?.data
  return Array.isArray(raw) ? raw : []
}

/** GET /api/admin/permissions — `data.all_permissions` */
function normalizePermissions(res) {
  return res?.data?.data?.all_permissions ?? []
}

export default function Admins() {
  const navigate = useNavigate()

  const {
    data: adminsRes,
    isLoading,
    refetch,
    error,
    isError,
  } = useQuery({
    queryKey: ['admins'],
    queryFn: () => axios.get(USERS.list, { headers: authHeaders() }),
  })

  const { data: permissionsRes } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => axios.get(PERMISSIONS_API.list, { headers: authHeaders() }),
  })

  useEffect(() => {
    if (!isError || !error) return
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('userToken')
      navigate('/login')
    }
    if (status === 403) {
      toast.error('You are not authorized to view this page')
      navigate('/home')
    }
  }, [isError, error, navigate])

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Admins</h1>
      <AdminsDataTable
        admins={normalizeUsersList(adminsRes)}
        allPermissions={normalizePermissions(permissionsRes)}
        loading={isLoading}
        refetch={refetch}
      />
    </div>
  )
}
