import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box } from '@mantine/core'

export default function BakeryIndex() {
    const { t } = useTranslation()
    return (
        <Box>{t('ManageUser')}</Box>
    )
}
