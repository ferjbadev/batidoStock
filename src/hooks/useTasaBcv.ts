import { useEffect, useState } from 'react';

const BCV_URL = 'https://ve.dolarapi.com/v1/dolares/oficial';

// El BCV publica una vez por día hábil, pero la app puede quedar abierta días
// en el teléfono, así que se revisa cada media hora.
const INTERVALO_MS = 30 * 60 * 1000;

export interface TasaBcv {
  valor: number;
  actualizada: string;
}

export const useTasaBcv = () => {
  const [tasa, setTasa] = useState<TasaBcv | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const cargarTasa = async () => {
      try {
        const res = await fetch(BCV_URL, { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) return;

        const data: { promedio?: number; fechaActualizacion?: string } = await res.json();
        if (typeof data.promedio === 'number') {
          setTasa({ valor: data.promedio, actualizada: data.fechaActualizacion ?? '' });
        }
      } catch {
        // Sin conexión o petición cancelada: se conserva el último valor mostrado.
      }
    };

    cargarTasa();

    const intervalo = setInterval(cargarTasa, INTERVALO_MS);

    // Al volver a la app después de tenerla en segundo plano, refrescar de una.
    const alVolverALaApp = () => {
      if (document.visibilityState === 'visible') cargarTasa();
    };
    document.addEventListener('visibilitychange', alVolverALaApp);

    return () => {
      controller.abort();
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alVolverALaApp);
    };
  }, []);

  return tasa;
};
