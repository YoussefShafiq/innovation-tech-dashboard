import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Home() {
    const navigate = useNavigate()
    const { t } = useTranslation()
    useEffect(() => {
        navigate('/user-setting')
    }, [navigate])

    return (
        <div className="p-6 text-gray-600 text-sm">{t('home.redirecting')}</div>
    )
}
