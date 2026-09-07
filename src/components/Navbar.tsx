import './Navbar.css'

const links = ['Inicio', 'Productos', 'Stock', 'Contacto']

function Navbar() {
  return (
    <nav className="navbar">
      <span className="navbar__brand">BatidoStock</span>
      <ul className="navbar__links">
        {links.map((link) => (
          <li key={link}>
            <a href={`#${link.toLowerCase()}`}>{link}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Navbar
