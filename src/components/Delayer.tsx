import { useEffect, useState } from 'react'
import { Spinner } from './ui/spinner'
import type { PropsWithChildren } from 'react';

export const Delayer = <T extends object>({
  data,
  children,
}: PropsWithChildren<{
  data: T
}>) => {
  const [display, setDisplay] = useState(!!data)
  useEffect(() => {
    setDisplay(false)
    setTimeout(() => setDisplay(true), 200)
  }, [data])

  return !display ? <Spinner /> : children
}
