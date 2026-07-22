const setFlag = () => undefined

export const useRegisterSW = () => ({
  offlineReady: [false, setFlag] as const,
  needRefresh: [false, setFlag] as const,
  updateServiceWorker: async () => undefined,
})
