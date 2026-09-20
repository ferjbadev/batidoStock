import { useEffect, useState } from 'react'

type RespuestaDolar = {
  promedio: number
  fechaActualizacion: string
}

const URL_BCV = 'https://ve.dolarapi.com/v1/dolares/oficial'

function PrecioDolar() {
  const [tasa, setTasa] = useState<RespuestaDolar | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controlador = new AbortController()

    fetch(URL_BCV, { signal: controlador.signal })
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error('respuesta no válida')
        return respuesta.json() as Promise<RespuestaDolar>
      })
      .then(setTasa)
      .catch(() => {
        if (!controlador.signal.aborted) setError(true)
      })

    return () => controlador.abort()
  }, [])

  if (error) {
    return <span className="text-xs text-error">BCV no disponible</span>
  }

  if (!tasa) {
    return <span className="loading loading-dots loading-sm" aria-label="Cargando tasa BCV" />
  }

  const fecha = new Date(tasa.fechaActualizacion).toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
  })

  return (
    <span
      className="badge badge-soft badge-success gap-1 whitespace-nowrap"
      title={`Tasa oficial BCV actualizada el ${fecha}`}
    >
      BCV Bs. {tasa.promedio.toFixed(2)}
      <span className="opacity-60">{fecha}</span>
    </span>
  )
}

export default PrecioDolar
