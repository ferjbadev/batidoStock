export const categorias = ['Batido', 'Jugo', 'Insumo'] as const

export type Categoria = (typeof categorias)[number]

export type Producto = {
  id: number
  nombre: string
  categoria: Categoria
  stock: number
  minimo: number
  precio: number
}

export type NuevoProducto = Omit<Producto, 'id'>
