import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    supabase,
    type AdvertenciaStock,
    type Producto,
    type ResultadoVenta,
    type Venta,
} from '../lib/supabase';

const formatMoney = (amount: number) =>
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatTime = (isoDate: string) =>
    new Date(isoDate).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

export const VentasSection = () => {
    const [sales, setSales] = useState<Venta[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [advertencias, setAdvertencias] = useState<AdvertenciaStock[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productoId, setProductoId] = useState('');
    const [productName, setProductName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const [ventasRes, productosRes] = await Promise.all([
                supabase.from('ventas').select('*').order('created_at', { ascending: false }).limit(50),
                supabase.from('productos').select('*').order('nombre'),
            ]);

            if (ventasRes.error || productosRes.error) {
                setError('No se pudieron cargar las ventas.');
            } else {
                setSales(ventasRes.data);
                setProductos(productosRes.data);
            }
            setIsLoading(false);
        };

        loadData();
    }, []);

    // Al elegir un batido se precarga su precio, pero sigue siendo editable.
    const handleSelectProducto = (id: string) => {
        setProductoId(id);
        const producto = productos.find((p) => p.id === id);
        if (producto) setPrice(String(Number(producto.precio)));
    };

    const handleAddSale = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quantity || !price) return;
        if (!productoId && !productName.trim()) return;

        setIsSaving(true);
        setAdvertencias([]);

        // Una sola llamada: registra la venta y descuenta el inventario en la misma transacción.
        const { data, error } = await supabase.rpc('registrar_venta', {
            p_cantidad: Number(quantity),
            p_producto_id: productoId || null,
            p_producto_nombre: productoId ? null : productName.trim(),
            p_precio_unitario: Number(price),
        });
        setIsSaving(false);

        if (error) {
            setError('No se pudo registrar la venta.');
            return;
        }

        const resultado = data as ResultadoVenta;
        setSales((prev) => [resultado.venta, ...prev]);
        setAdvertencias(resultado.advertencias);
        setProductoId('');
        setProductName('');
        setQuantity('');
        setPrice('');
        setIsModalOpen(false);
    };

    const handleDeleteSale = async (sale: Venta) => {
        setSales((prev) => prev.filter((s) => s.id !== sale.id));

        const { error } = await supabase.from('ventas').delete().eq('id', sale.id);

        if (error) {
            setError('No se pudo eliminar la venta.');
            setSales((prev) =>
                [sale, ...prev].sort((a, b) => b.created_at.localeCompare(a.created_at))
            );
        }
    };

    const totalDelDia = sales
        .filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString())
        .reduce((acc, s) => acc + Number(s.total), 0);

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans text-stone-800">
            {/* Contenedor Principal */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-6"
            >
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-stone-900">Ventas</h2>
                        <p className="text-base text-stone-500">Registro detallado de lo que vendes pomposa</p>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Hoy</p>
                        <p className="font-bold text-[#1e6044]">{formatMoney(totalDelDia)}</p>
                    </div>
                </div>

                {error && (
                    <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2.5">
                        {error}
                    </div>
                )}

                {advertencias.length > 0 && (
                    <div className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5 space-y-1">
                        <p className="font-bold">Venta registrada, pero el inventario no alcanzaba:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            {advertencias.map((aviso) => (
                                <li key={aviso.ingrediente}>
                                    <span className="font-semibold">{aviso.ingrediente}</span>: faltaron{' '}
                                    {aviso.faltante} {aviso.faltante === 1 ? 'unidad' : 'unidades'} (quedó en 0)
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Lista de ventas animada */}
                {isLoading ? (
                    <p className="text-center text-sm text-stone-400 py-8">Cargando ventas...</p>
                ) : sales.length === 0 ? (
                    <p className="text-center text-sm text-stone-400 py-8">
                        Todavía no hay ventas registradas.
                    </p>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence initial={false}>
                            {sales.map((sale) => (
                                <motion.div
                                    key={sale.id}
                                    layout
                                    initial={{ opacity: 0, y: -15, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.25, ease: 'easeOut' }}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-stone-100 hover:bg-stone-50 transition-colors gap-3"
                                >
                                    {/* Izquierda: Fecha y Hora */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="font-bold text-stone-900 text-sm capitalize">
                                            {formatDate(sale.created_at)}
                                        </span>
                                        <span className="text-[11px] text-stone-400">
                                            {formatTime(sale.created_at)}
                                        </span>
                                    </div>

                                    {/* Derecha / Centro */}
                                    <div className="flex items-center justify-between gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-stone-100">
                                        <p className="text-xs font-medium text-stone-700 truncate">
                                            {sale.cantidad}x {sale.producto}
                                        </p>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="font-bold text-stone-900 text-sm">
                                                {formatMoney(Number(sale.total))}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteSale(sale)}
                                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                aria-label={`Eliminar venta de ${sale.producto}`}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Botón inferior */}
                <div className="pt-2 flex justify-center border-t border-stone-100">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#1e6044] hover:bg-[#164833] text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                        <span>+</span> Registrar Venta
                    </button>
                </div>
            </motion.div>

            {/* Modal con animación de entrada y salida */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
                        />

                        {/* Modal Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="relative z-10 bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-stone-100 space-y-5"
                        >
                            <div className="relative flex items-center justify-center">
                                <h3 className="text-lg font-bold text-stone-900 text-center">
                                    Registrar nueva venta
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="absolute right-0 p-1 rounded-lg text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleAddSale} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-stone-600 mb-1">
                                        ¿Qué vendiste?
                                    </label>
                                    <select
                                        value={productoId}
                                        onChange={(e) => handleSelectProducto(e.target.value)}
                                        className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#1e6044] text-stone-800 cursor-pointer"
                                    >
                                        <option value="">Otro (no descuenta inventario)</option>
                                        {productos.map((producto) => (
                                            <option key={producto.id} value={producto.id}>
                                                {producto.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {productos.length === 0 && (
                                        <p className="text-[11px] text-amber-700 mt-1.5">
                                            Crea tus batidos en la sección "Batidos" para que el inventario se
                                            descuente automáticamente.
                                        </p>
                                    )}
                                </div>

                                {!productoId && (
                                    <div>
                                        <label className="block text-xs font-medium text-stone-600 mb-1">
                                            Nombre del producto
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej. Mango tropical"
                                            value={productName}
                                            onChange={(e) => setProductName(e.target.value)}
                                            className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#1e6044] text-stone-800 placeholder-stone-400"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-medium text-stone-600 mb-1">
                                        Cantidad
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        placeholder="Ej. 2"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#1e6044] text-stone-800 placeholder-stone-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-stone-600 mb-1">
                                        Precio por unidad ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        placeholder="Ej. 8.50"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#1e6044] text-stone-800 placeholder-stone-400"
                                    />
                                </div>

                                <div className="flex items-center justify-center gap-3 pt-3">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="bg-[#1e6044] hover:bg-[#164833] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                                    >
                                        {isSaving ? 'Guardando...' : 'Agregar venta'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="bg-[#e62107] hover:bg-[#c41a00] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
