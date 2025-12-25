import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        throwOnError(error) {
          toast.error(error.message)
          return false
        },
      },
      mutations: {
        onError(error) {
          toast.error(error.message)
        },
      },
    },
  })
  return {
    queryClient,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
