import { useState } from 'react'
import './Navbar.css'

const links = [
  { etiqueta: 'Inicio', href: '#inicio' },
  { etiqueta: 'Inventario', href: '#stock' },
]

function Navbar() {
  const [abierto, setAbierto] = useState(false)

  return (
    <nav className="navbar">
      <div className="navbar__barra">
        <span className="navbar__brand">BatidoStock</span>
        <button
          type="button"
          className="navbar__toggle"
          aria-expanded={abierto}
          aria-controls="navbar-menu"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setAbierto((actual) => !actual)}
        >
          <span className="navbar__icono" aria-hidden="true">
            {abierto ? '✕' : '☰'}
          </span>
        </button>
      </div>

      <ul
        id="navbar-menu"
        className={`navbar__links ${abierto ? 'navbar__links--abierto' : ''}`}
      >
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} onClick={() => setAbierto(false)}>
              {link.etiqueta}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Navbar
