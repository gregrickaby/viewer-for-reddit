'use client'

import {AppStore, makeStore, type RootState} from '@/lib/store'
import {setupListeners} from '@reduxjs/toolkit/query'
import {useEffect, useMemo, type ReactNode} from 'react'
import {Provider} from 'react-redux'

export interface StoreProviderProps {
  children: ReactNode
  preloadedState?: Partial<RootState>
  store?: AppStore
}

export function StoreProvider({
  children,
  store: externalStore,
  preloadedState
}: Readonly<StoreProviderProps>) {
  const store = useMemo(
    () => externalStore ?? makeStore(preloadedState),
    [externalStore, preloadedState]
  )

  useEffect(() => {
    const unsubscribe = setupListeners(store.dispatch)
    return unsubscribe
  }, [store])

  return <Provider store={store}>{children}</Provider>
}
