'use client'

import {AppStore, makeStore} from '@/lib/store'
import {setupListeners} from '@reduxjs/toolkit/query'
import {useEffect, useMemo, type ReactNode} from 'react'
import {Provider} from 'react-redux'

export interface StoreProviderProps {
  children: ReactNode
  store?: AppStore
}

export function StoreProvider({
  children,
  store: externalStore
}: Readonly<StoreProviderProps>) {
  const store = useMemo(() => externalStore ?? makeStore(), [externalStore])

  useEffect(() => {
    const unsubscribe = setupListeners(store.dispatch)
    return unsubscribe
  }, [store])

  return <Provider store={store}>{children}</Provider>
}
