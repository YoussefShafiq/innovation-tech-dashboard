import React, { useContext } from 'react'
import Sidebar from './Sidebar'
import { Outlet, useNavigate } from 'react-router-dom'
import { SidebarContext } from '../../Contexts/SidebarContext'
import { UserCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { AUTH, authHeaders, getAccountFromProfileResponse } from '../../constants/urls.js'

export function UserBar() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => axios.get(AUTH.profile, { headers: authHeaders() }),
  })
  const account = getAccountFromProfileResponse(currentUser)
  return (
    <div
      onClick={() => navigate('/user-setting')}
      className={`fixed top-5 ${i18n.dir() === 'rtl' ? 'left-5' : 'right-5'} h-11 w-11 flex justify-center items-center rounded-full bg-white cursor-pointer shadow-lg z-[60]`}
    >
      {account?.profile_image ? (
        <img src={account.profile_image} alt="Profile" className="w-10 h-10 rounded-full object-cover border-gray-200" />
      ) : (
        <UserCircle2 className="hover:scale-[1.04] transition-all" />
      )}
    </div>
  )
}

export default function Layout() {
  const { sidebarOpen } = useContext(SidebarContext)
  return (
    <>
      <UserBar />
      <div className="flex min-h-screen transition-all duration-500">
        <div className={`${sidebarOpen ? 'md:w-56' : 'w-0'} transition-all duration-500`}>
          <Sidebar />
        </div>
        <div className="flex-1 transition-all duration-500 bg-background text-black md:p-5">
          <Outlet />
        </div>
      </div>
    </>
  )
}
