import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (apiCall, options = {}) => {
    const {
      onSuccess,
      onError,
      successMessage,
      errorMessage,
      showErrorToast = true,
    } = options

    setLoading(true)
    setError(null)

    try {
      const response = await apiCall()
      const data = response?.data
      if (successMessage) toast.success(successMessage)
      if (onSuccess) onSuccess(data)
      return data
    } catch (err) {
      const msg = err.message || 'Request failed'
      setError(msg)
      if (showErrorToast) toast.error(errorMessage || msg)
      if (onError) onError(err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, execute }
}
