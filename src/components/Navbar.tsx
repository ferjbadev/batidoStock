import './Navbar.css'

const links = [
  { etiqueta: 'Inicio', href: '#inicio' },
  { etiqueta: 'Inventario', href: '#stock' },
]

function Navbar() {
  return (
    <nav className="navbar">
      <span className="navbar__brand">BatidoStock</span>
      <ul className="navbar__links">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href}>{link.etiqueta}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Navbar
