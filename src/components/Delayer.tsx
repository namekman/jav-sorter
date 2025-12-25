import { useState, useEffect, PropsWithChildren } from 'react'
import { Spinner } from './ui/spinner'

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
