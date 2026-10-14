import { useLayoutEffect, useRef } from "react"

/**
 * Ref que siempre apunta al valor más reciente (típicamente un callback) sin
 * re-ejecutar efectos cuando cambia. La escritura se hace en un layout effect
 * —no durante el render— para que un render descartado por React no filtre un
 * valor que nunca llegó a confirmarse.
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value)
  useLayoutEffect(() => {
    ref.current = value
  })
  return ref
}
