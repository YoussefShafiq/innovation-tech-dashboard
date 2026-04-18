import React, { useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Notfound() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/')
  }, [navigate])

  return (
    <>
      <Helmet>
        <title>{t('notfound.title')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
    </>
  )
}
