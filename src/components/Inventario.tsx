import { useState } from 'react'
import type { NuevoProducto, Producto } from '../types'
import FormularioProducto from './FormularioProducto'
import './Inventario.css'

const productosIniciales: Producto[] = [
  { id: 1, nombre: 'Batido de fresa', categoria: 'Batido', stock: 12, minimo: 5, precio: 3.5 },
  { id: 2, nombre: 'Batido de chocolate', categoria: 'Batido', stock: 3, minimo: 5, precio: 3.8 },
  { id: 3, nombre: 'Jugo de naranja', categoria: 'Jugo', stock: 20, minimo: 8, precio: 2.5 },
  { id: 4, nombre: 'Leche entera (L)', categoria: 'Insumo', stock: 6, minimo: 10, precio: 1.2 },
]

function Inventario() {
  const [productos, setProductos] = useState<Producto[]>(productosIniciales)

  const agregarProducto = (nuevo: NuevoProducto) => {
    setProductos((actuales) => [
      ...actuales,
      { ...nuevo, id: Math.max(0, ...actuales.map((producto) => producto.id)) + 1 },
    ])
  }

  const ajustarStock = (id: number, delta: number) => {
    setProductos((actuales) =>
      actuales.map((producto) =>
        producto.id === id
          ? { ...producto, stock: Math.max(0, producto.stock + delta) }
          : producto,
      ),
    )
  }

  const valorTotal = productos.reduce(
    (total, producto) => total + producto.stock * producto.precio,
    0,
  )
  const bajoStock = productos.filter((producto) => producto.stock < producto.minimo)

  return (
    <section className="inventario" id="stock">
      <header className="inventario__header">
        <h2>Inventario</h2>
        <div className="inventario__resumen">
          <span>{productos.length} productos</span>
          <span>Valor: ${valorTotal.toFixed(2)}</span>
          <span className={bajoStock.length ? 'inventario__alerta' : undefined}>
            {bajoStock.length} bajo mínimo
          </span>
        </div>
      </header>

      <FormularioProducto onAgregar={agregarProducto} />

      <table className="inventario__tabla">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Stock</th>
            <th>Precio</th>
            <th>Estado</th>
            <th>Ajustar</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => {
            const esBajo = producto.stock < producto.minimo
            return (
              <tr key={producto.id}>
                <td>{producto.nombre}</td>
                <td>{producto.categoria}</td>
                <td>{producto.stock}</td>
                <td>${producto.precio.toFixed(2)}</td>
                <td>
                  <span className={`etiqueta ${esBajo ? 'etiqueta--bajo' : 'etiqueta--ok'}`}>
                    {esBajo ? 'Bajo stock' : 'Disponible'}
                  </span>
                </td>
                <td className="inventario__acciones">
                  <button type="button" onClick={() => ajustarStock(producto.id, -1)}>
                    -
                  </button>
                  <button type="button" onClick={() => ajustarStock(producto.id, 1)}>
                    +
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

export default Inventario
