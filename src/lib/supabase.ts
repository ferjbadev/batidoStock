import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_PUBLISHABLE_KEY. Copia .env.example como .env.local y rellena los valores.'
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: false },
});

export interface Ingrediente {
  id: string;
  nombre: string;
  stock: number;
  created_at: string;
}

export interface Venta {
  id: string;
  producto: string;
  producto_id: string | null;
  cantidad: number;
  precio_unitario: number;
  total: number;
  created_at: string;
}

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  created_at: string;
}

export interface Receta {
  id: string;
  producto_id: string;
  ingrediente_id: string;
  cantidad: number;
}

/** Producto con su receta y el nombre de cada ingrediente ya resuelto. */
export interface ProductoConReceta extends Producto {
  recetas: (Receta & { inventario: Pick<Ingrediente, 'id' | 'nombre' | 'stock'> | null })[];
}

export interface AdvertenciaStock {
  ingrediente: string;
  faltante: number;
}

export interface ResultadoVenta {
  venta: Venta;
  advertencias: AdvertenciaStock[];
}
