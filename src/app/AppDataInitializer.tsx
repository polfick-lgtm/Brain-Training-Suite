import { useEffect } from 'react'
import { useTrainingStore } from '../storage/useTrainingStore'

const textScale = { normal: '100%', large: '112.5%', 'extra-large': '125%' }

export function AppDataInitializer() {
  const hydrate = useTrainingStore((state) => state.hydrate)
  const settings = useTrainingStore((state) => state.settings)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = settings.theme
    root.style.fontSize = textScale[settings.textScale]
    root.classList.toggle('reduce-motion', settings.reduceMotion)
  }, [settings])

  return null
}
