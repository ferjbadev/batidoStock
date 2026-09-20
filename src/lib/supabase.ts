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
  cantidad: number;
  precio_unitario: number;
  total: number;
  created_at: string;
}
