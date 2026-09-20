import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasaBcv } from '../hooks/useTasaBcv';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarMobileProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const SidebarMobile = ({ activeTab, setActiveTab }: SidebarMobileProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tasaBcv = useTasaBcv();

  const fechaTasa = tasaBcv?.actualizada
    ? new Date(tasaBcv.actualizada).toLocaleDateString('es-VE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : null;

  const menuItems: MenuItem[] = [
    {
      id: 'ventas',
      label: 'Ventas',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      id: 'productos',
      label: 'Batidos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 3h12l-1.2 16.2A2 2 0 0114.8 21H9.2a2 2 0 01-2-1.8L6 3zm.6 6h10.8" />
        </svg>
      ),
    },
    {
      id: 'inventario',
      label: 'Inventario',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      id: 'resumen',
      label: 'Historial',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
  ];

  // Variantes para escalonar la entrada de los ítems del menú
  const menuVariants = {
    open: {
      transition: { staggerChildren: 0.07, delayChildren: 0.1 }
    },
    closed: {
      transition: { staggerChildren: 0.05, staggerDirection: -1 }
    }
  };

  const itemVariants = {
    open: {
      y: 0,
      opacity: 1,
      transition: { y: { stiffness: 1000, velocity: -100 } }
    },
    closed: {
      y: 15,
      opacity: 0,
      transition: { y: { stiffness: 1000 } }
    }
  };

  return (
    <>
      {/* Top Bar Fija */}
      <header className="sticky top-0 z-30 w-full bg-[#1e6044] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => setIsOpen(true)}
            className="p-2 text-white hover:bg-white/10 rounded-xl transition-colors"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </motion.button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
              <img
                src="/imagen3.png"
                alt="Karito Stock Icono"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-base tracking-wide">Karito Stock</span>
          </div>
        </div>

        {/* Tasa de cambio BCV */}
        <div
          title={fechaTasa ? `Tasa oficial del BCV del ${fechaTasa}` : 'Consultando la tasa del BCV...'}
          className="w-auto px-3 h-8 rounded-full bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/30"
        >
          <span>$1</span>
          <svg className="w-3.5 h-3.5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-3-3m3 3l-3 3M16 17H4m0 0l3 3m-3-3l3-3" />
          </svg>
          <span>
            {tasaBcv
              ? `Bs. ${tasaBcv.valor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'Bs. --'}
          </span>
        </div>
      </header>

      {/* Overlay + Sidebar con AnimatePresence */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dark Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs"
            />

            {/* Sidebar Deslizable */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-full max-w-[300px] bg-[#fbf9f5] flex flex-col justify-between p-5 border-r border-stone-200/60 font-sans text-stone-800 shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-sm shrink-0">
                      <img
                        src="/imagen2.png"
                        alt="Logo Karito Stock"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="font-bold text-base leading-tight text-stone-900">Karito Stock</h2>
                      <p className="text-xs text-stone-500 font-medium">Panel de control</p>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                <motion.nav
                  variants={menuVariants}
                  initial="closed"
                  animate="open"
                  className="space-y-1.5"
                >
                  {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        variants={itemVariants}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsOpen(false);
                        }}
                        className={`relative w-full flex items-center justify-between px-4 py-3 rounded-2xl font-medium text-sm transition-colors duration-150 ${
                          isActive
                            ? 'text-white'
                            : 'text-stone-600 hover:bg-stone-200/40 hover:text-stone-900'
                        }`}
                      >
                        {/* Background animado para la pestaña activa */}
                        {isActive && (
                          <motion.div
                            layoutId="activeTabBackground"
                            className="absolute inset-0 bg-[#1e6044] rounded-2xl shadow-sm z-0"
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          />
                        )}

                        <div className="relative z-10 flex items-center gap-3.5">
                          <span className={isActive ? 'text-white' : 'text-stone-500'}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`relative z-10 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-rose-100 text-rose-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.nav>
              </div>

              {/* Banner Inferior y Usuario */}
              <div className="space-y-4">
                <div className="bg-[#eaf3de] p-3.5 rounded-2xl space-y-1 border border-[#d8e8c5]">
                  <h3 className="font-bold text-stone-900 text-xs">Tu operación, más fresca</h3>
                  <p className="text-[11px] text-stone-600 leading-tight">
                    Revisa los ingredientes antes del próximo pedido.
                  </p>
                </div>

                <hr className="border-stone-200/80" />

                {/* Perfil del Usuario */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3">
                    <img
                      src="/imagen1.jpeg"
                      alt="Karolayn Romero"
                      className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0 shadow-xs"
                    />
                    <div className="ml-1">
                      <p className="font-bold text-stone-900 text-xs leading-tight">Karolayn Romero</p>
                      <p className="text-[11px] text-stone-500 font-medium">Administradora</p>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="text-stone-400 hover:text-stone-700 p-1.5 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
                    aria-label="Ver perfil"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Presentación */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop con Fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Content con Pop/Scale Animation */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-stone-100"
            >
              {/* Header del Modal */}
              <div className="relative p-4 bg-[#1e6044] text-white text-center">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-3 right-3 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Cerrar modal"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
                <h3 className="font-bold text-lg">Perfil</h3>
              </div>

              {/* Cuerpo del Modal */}
              <div className="p-6 text-center space-y-4 flex flex-col items-center">
                <div className="relative w-36 h-36 mx-auto rounded-2xl overflow-hidden shadow-md border-2 border-[#1e6044]/20">
                  <img
                    src="/imagen1.jpeg"
                    alt="Karolayn Romero"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h4 className="text-xl font-extrabold text-stone-900">Karolayn Romero</h4>
                  <p className="text-sm font-semibold text-[#1e6044] mt-0.5">Profesión: Ser Tontita</p>
                </div>

                <div className="bg-[#fbf9f5] p-4 rounded-2xl border border-stone-200/70 text-left w-full">
                  <p className="text-xs text-stone-600 leading-relaxed font-medium">
                    Apasionada emprendedora dedicada a la elaboración de jugos y batidos 100% naturales. <br />
                    <br />
                    Próximamente se volverá más loquita por tanto BTS.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-auto px-6 py-2.5 bg-[#1e6044] text-white text-sm font-semibold rounded-xl hover:bg-[#184d36] transition-colors shadow-sm cursor-pointer"
                >
                  Cerrar
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};