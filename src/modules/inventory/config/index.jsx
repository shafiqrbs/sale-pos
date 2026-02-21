import { APP_NAVLINKS } from '@/routes/routes'
import { Box } from '@mantine/core'
import { useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router'

export default function ConfigIndex() {
    const { isOnline } = useOutletContext()
    const navigate = useNavigate()

    useEffect(() => {
        if (!isOnline) {
            navigate(APP_NAVLINKS.BAKERY)
        }
    }, [ isOnline, navigate ])

    return (
        <Box p="xs" bg="var(--theme-grey-color-0)">
            Hello
        </Box>
    )
}
