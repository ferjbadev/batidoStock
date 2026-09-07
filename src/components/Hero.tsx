import './Hero.css'

function Hero() {
  return (
    <section className="hero" id="inicio">
      <h1 className="hero__title">Hola mundo</h1>
      <p className="hero__subtitle">
        Controla el stock de tus batidos en un solo lugar.
      </p>
      <a className="hero__cta" href="#stock">
        Ver inventario
      </a>
    </section>
  )
}

export default Hero
