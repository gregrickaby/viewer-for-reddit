'use client'

import { AppStore, makeStore } from '@/lib/store'
import { useRef } from 'react'
import { Provider } from 'react-redux'

/**
 * Provides the Redux store to the application.
 */
export function StoreProvider({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const storeRef = useRef<AppStore>(undefined)
  if (!storeRef.current) {
    storeRef.current = makeStore()
  }

  return <Provider store={storeRef.current}>{children}</Provider>
}
