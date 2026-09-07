import { useState } from 'react'
import type { FormEvent } from 'react'
import { categorias } from '../types'
import type { Categoria, NuevoProducto } from '../types'
import './FormularioProducto.css'

type Props = {
  onAgregar: (producto: NuevoProducto) => void
}

const valoresIniciales = {
  nombre: '',
  categoria: 'Batido' as Categoria,
  stock: '0',
  minimo: '0',
  precio: '0',
}

function FormularioProducto({ onAgregar }: Props) {
  const [valores, setValores] = useState(valoresIniciales)
  const [error, setError] = useState('')

  const actualizar = (campo: 'nombre' | 'stock' | 'minimo' | 'precio', valor: string) => {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
  }

  const actualizarCategoria = (categoria: Categoria) => {
    setValores((actuales) => ({ ...actuales, categoria }))
  }

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()

    const nombre = valores.nombre.trim()
    const stock = Number(valores.stock)
    const minimo = Number(valores.minimo)
    const precio = Number(valores.precio)

    if (!nombre) {
      setError('El nombre es obligatorio.')
      return
    }
    if ([stock, minimo, precio].some((valor) => !Number.isFinite(valor) || valor < 0)) {
      setError('Stock, mínimo y precio deben ser números mayores o iguales a 0.')
      return
    }

    onAgregar({ nombre, categoria: valores.categoria, stock, minimo, precio })
    setValores(valoresIniciales)
    setError('')
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <h3 className="formulario__titulo">Agregar producto</h3>

      <div className="formulario__campos">
        <label>
          Nombre
          <input
            type="text"
            value={valores.nombre}
            placeholder="Batido de mango"
            onChange={(evento) => actualizar('nombre', evento.target.value)}
          />
        </label>

        <label>
          Categoría
          <select
            value={valores.categoria}
            onChange={(evento) => actualizarCategoria(evento.target.value as Categoria)}
          >
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </label>

        <label>
          Stock
          <input
            type="number"
            min="0"
            value={valores.stock}
            onChange={(evento) => actualizar('stock', evento.target.value)}
          />
        </label>

        <label>
          Mínimo
          <input
            type="number"
            min="0"
            value={valores.minimo}
            onChange={(evento) => actualizar('minimo', evento.target.value)}
          />
        </label>

        <label>
          Precio
          <input
            type="number"
            min="0"
            step="0.01"
            value={valores.precio}
            onChange={(evento) => actualizar('precio', evento.target.value)}
          />
        </label>

        <button type="submit">Agregar</button>
      </div>

      {error && <p className="formulario__error">{error}</p>}
    </form>
  )
}

export default FormularioProducto
