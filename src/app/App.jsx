import { Box } from '@mantine/core'
import './App.css'
import AppRoutes from '@/routes/AppRoutes'

function App() {
  return (
    <Box bg="var(--theme-primary-color-6)">
      <AppRoutes />
    </Box>
  )
}

export default App
