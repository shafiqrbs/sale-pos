import { Box } from '@mantine/core'
import './App.css'
import AppRoutes from '@/routes/AppRoutes'
import ErrorBoundary from '@components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <Box>
        <AppRoutes />
      </Box>
    </ErrorBoundary>
  )
}

export default App
