import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function RouteFocusManager() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.querySelector<HTMLElement>('#contenuto-principale')?.focus()
  }, [pathname])

  return null
}
