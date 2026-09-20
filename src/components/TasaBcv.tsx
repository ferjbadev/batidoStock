import { useEffect, useState } from 'react';

type RespuestaBcv = {
  promedio: number;
  fechaActualizacion: string;
};

const URL_BCV = 'https://ve.dolarapi.com/v1/dolares/oficial';

export const TasaBcv = () => {
  const [tasa, setTasa] = useState<RespuestaBcv | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controlador = new AbortController();

    fetch(URL_BCV, { signal: controlador.signal })
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error('Respuesta no válida del servicio BCV');
        return respuesta.json() as Promise<RespuestaBcv>;
      })
      .then(setTasa)
      .catch(() => {
        if (!controlador.signal.aborted) setError(true);
      });

    return () => controlador.abort();
  }, []);

  const contenedor =
    'w-auto px-3 h-8 rounded-full bg-white/20 text-white font-semibold text-xs flex items-center justify-center border border-white/30 gap-1';

  if (error) {
    return <div className={contenedor}>BCV s/d</div>;
  }

  if (!tasa) {
    return (
      <div className={contenedor} aria-label="Cargando tasa BCV">
        BCV ...
      </div>
    );
  }

  const monto = tasa.promedio.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const fecha = new Date(tasa.fechaActualizacion).toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
  });

  return (
    <div className={contenedor} title={`Tasa oficial BCV del ${fecha}`}>
      <span className="opacity-70">BCV</span>
      <span>Bs. {monto}</span>
    </div>
  );
};
