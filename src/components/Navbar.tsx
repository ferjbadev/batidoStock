import { useState } from 'react'

const links = [
  { etiqueta: 'Inicio', href: '#inicio' },
  { etiqueta: 'Inventario', href: '#stock' },
]

function Navbar() {
  const [abierto, setAbierto] = useState(false)

  return (
    <header className="navbar sticky top-0 z-10 flex-col items-stretch bg-base-100 shadow-sm md:flex-row md:items-center">
      <div className="flex w-full items-center justify-between md:w-auto md:flex-1">
        <a className="btn btn-ghost text-xl text-success" href="#inicio">
          BatidoStock
        </a>
        <button
          type="button"
          className="btn btn-square btn-ghost md:hidden"
          aria-expanded={abierto}
          aria-controls="navbar-menu"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setAbierto((actual) => !actual)}
        >
          <span aria-hidden="true" className="text-xl">
            {abierto ? '✕' : '☰'}
          </span>
        </button>
      </div>

      <nav className={abierto ? 'block w-full md:w-auto' : 'hidden md:block'}>
        <ul id="navbar-menu" className="menu w-full menu-vertical md:menu-horizontal">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={() => setAbierto(false)}>
                {link.etiqueta}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

export default Navbar
