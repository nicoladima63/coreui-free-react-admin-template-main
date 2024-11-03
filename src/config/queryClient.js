import { QueryClient } from '@tanstack/react-query'
import { getErrorMessage } from '../constants/errorMessages'

export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Non riprovare per errori 4xx
          if (error.code >= 400 && error.code < 500) return false
          // Riprova fino a 3 volte per altri errori
          return failureCount < 3
        },
        staleTime: 5 * 60 * 1000, // 5 minuti
        cacheTime: 10 * 60 * 1000, // 10 minuti
      },
      mutations: {
        onError: (error) => {
          console.error('Mutation error:', error)
          // Qui puoi aggiungere una logica centralizzata per la gestione degli errori
          // Per esempio, mostrare un toast con l'errore
        },
      },
    },
  })
}

// Hook personalizzato per gestire gli errori delle query
export const useQueryErrorHandler = () => {
  return {
    onError: (error) => {
      const message = getErrorMessage(error)
      // Qui puoi aggiungere una logica personalizzata per la gestione degli errori
      console.error('Query error:', message)
    },
  }
}
