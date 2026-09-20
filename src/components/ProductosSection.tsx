import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    supabase,
    type Ingrediente,
    type ProductoConReceta,
    type Receta,
} from '../lib/supabase';

const SELECT_PRODUCTOS = '*, recetas(*, inventario(id, nombre, stock))';

export const ProductosSection = () => {
    const [productos, setProductos] = useState<ProductoConReceta[]>([]);
    const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');
    const [cantidades, setCantidades] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    const loadData = useCallback(async () => {
        const [productosRes, inventarioRes] = await Promise.all([
            supabase.from('productos').select(SELECT_PRODUCTOS).order('created_at'),
            supabase.from('inventario').select('*').order('nombre'),
        ]);

        if (productosRes.error || inventarioRes.error) {
            setError('No se pudieron cargar los batidos.');
            return;
        }

        setProductos(productosRes.data as ProductoConReceta[]);
        setIngredientes(inventarioRes.data);
    }, []);

    useEffect(() => {
        const init = async () => {
            await loadData();
            setIsLoading(false);
        };

        init();
    }, [loadData]);

    const handleCreateProducto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) return;

        setIsSaving(true);
        const { data: producto, error: productoError } = await supabase
            .from('productos')
            .insert({ nombre: nombre.trim(), precio: Number(precio || 0) })
            .select()
            .single();

        if (productoError) {
            setError('No se pudo crear el batido.');
            setIsSaving(false);
            return;
        }

        const lineas = Object.entries(cantidades)
            .filter(([, valor]) => Number(valor) > 0)
            .map(([ingrediente_id, valor]) => ({
                producto_id: producto.id,
                ingrediente_id,
                cantidad: Number(valor),
            }));

        if (lineas.length > 0) {
            const { error: recetaError } = await supabase.from('recetas').insert(lineas);
            if (recetaError) setError('El batido se creó, pero la receta no se guardó completa.');
        }

        await loadData();
        setIsSaving(false);
        setNombre('');
        setPrecio('');
        setCantidades({});
        setIsModalOpen(false);
    };

    const handleDeleteProducto = async (producto: ProductoConReceta) => {
        setProductos((prev) => prev.filter((p) => p.id !== producto.id));

        const { error } = await supabase.from('productos').delete().eq('id', producto.id);
        if (error) {
            setError('No se pudo eliminar el batido.');
            await loadData();
        }
    };

    const handleUpdateReceta = async (receta: Receta, delta: number) => {
        const nuevaCantidad = receta.cantidad + delta;

        const { error } =
            nuevaCantidad <= 0
                ? await supabase.from('recetas').delete().eq('id', receta.id)
                : await supabase
                      .from('recetas')
                      .update({ cantidad: nuevaCantidad })
                      .eq('id', receta.id);

        if (error) {
            setError('No se pudo actualizar la receta.');
            return;
        }

        await loadData();
    };

    const handleAddIngredienteAReceta = async (productoId: string, ingredienteId: string) => {
        if (!ingredienteId) return;

        const { error } = await supabase
            .from('recetas')
            .insert({ producto_id: productoId, ingrediente_id: ingredienteId, cantidad: 1 });

        if (error) {
            setError('No se pudo añadir el ingrediente a la receta.');
            return;
        }

        await loadData();
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans text-stone-800">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-6"
            >
                <div>
                    <h2 className="text-2xl text-center font-bold text-stone-900">Mis Batidos</h2>
                    <p className="text-base text-center text-stone-500">
                        Define qué ingredientes lleva cada batido y el inventario se descuenta solito
                    </p>
                </div>

                {error && (
                    <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2.5">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <p className="text-center text-sm text-stone-400 py-8">Cargando batidos...</p>
                ) : ingredientes.length === 0 ? (
                    <p className="text-center text-sm text-stone-400 py-8">
                        Primero añade ingredientes en la sección Inventario.
                    </p>
                ) : productos.length === 0 ? (
                    <p className="text-center text-sm text-stone-400 py-8">
                        Todavía no hay batidos. Crea el primero.
                    </p>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence initial={false}>
                            {productos.map((producto) => {
                                const usados = producto.recetas.map((r) => r.ingrediente_id);
                                const disponibles = ingredientes.filter((i) => !usados.includes(i.id));

                                return (
                                    <motion.div
                                        key={producto.id}
                                        layout
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.97 }}
                                        transition={{ duration: 0.25, ease: 'easeOut' }}
                                        className="rounded-2xl border border-stone-100 p-4 space-y-3 hover:bg-stone-50/40 transition-colors"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="font-bold text-stone-900 text-sm">{producto.nombre}</h3>
                                                <p className="text-xs text-stone-500">
                                                    ${Number(producto.precio).toFixed(2)} por unidad
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteProducto(producto)}
                                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                aria-label={`Eliminar ${producto.nombre}`}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        {producto.recetas.length === 0 ? (
                                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                                Sin receta: al vender este batido no se descuenta nada.
                                            </p>
                                        ) : (
                                            <ul className="space-y-1.5">
                                                {producto.recetas.map((receta) => (
                                                    <li
                                                        key={receta.id}
                                                        className="flex items-center justify-between gap-3 text-xs"
                                                    >
                                                        <span className="font-medium text-stone-700">
                                                            {receta.inventario?.nombre ?? 'Ingrediente eliminado'}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateReceta(receta, -1)}
                                                                className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 font-bold hover:bg-stone-200 transition-colors cursor-pointer"
                                                                aria-label="Reducir cantidad de la receta"
                                                            >
                                                                −
                                                            </button>
                                                            <span className="font-semibold text-stone-800 min-w-[60px] text-center">
                                                                {receta.cantidad} {receta.cantidad === 1 ? 'unidad' : 'unidades'}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateReceta(receta, 1)}
                                                                className="w-6 h-6 rounded-lg bg-[#eaf3de] text-[#1e6044] font-bold hover:bg-[#d8e8c5] transition-colors cursor-pointer"
                                                                aria-label="Aumentar cantidad de la receta"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {disponibles.length > 0 && (
                                            <select
                                                value=""
                                                onChange={(e) => handleAddIngredienteAReceta(producto.id, e.target.value)}
                                                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-600 focus:outline-none focus:border-[#1e6044] cursor-pointer"
                                            >
                                                <option value="">+ Añadir ingrediente a la receta</option>
                                                {disponibles.map((ingrediente) => (
                                                    <option key={ingrediente.id} value={ingrediente.id}>
                                                        {ingrediente.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}

                <div className="pt-2 flex justify-center border-t border-stone-100">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        disabled={ingredientes.length === 0}
                        className="bg-[#1e6044] hover:bg-[#164833] text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <span>+</span> Crear batido
                    </button>
                </div>
            </motion.div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="relative z-10 bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-stone-100 space-y-5 max-h-[85vh] overflow-y-auto"
                        >
                            <div className="relative flex items-center justify-center">
                                <h3 className="text-lg font-bold text-stone-900 text-center">Crear nuevo batido</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="absolute right-0 p-1 rounded-lg text-black hover:opacity-75 transition-opacity cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleCreateProducto} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-stone-600 mb-1">
                                        Nombre del batido
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. Batido de fresa"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#1e6044] text-stone-800 placeholder-stone-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-stone-600 mb-1">
                                        Precio de venta ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        placeholder="Ej. 3.50"
                                        value={precio}
                                        onChange={(e) => setPrecio(e.target.value)}
                                        className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#1e6044] text-stone-800 placeholder-stone-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-stone-600">
                                        Receta: cuánto gasta de cada ingrediente
                                    </label>
                                    <p className="text-[11px] text-stone-400">
                                        Deja en 0 los que no lleva.
                                    </p>
                                    <div className="space-y-2 pt-1">
                                        {ingredientes.map((ingrediente) => (
                                            <div key={ingrediente.id} className="flex items-center justify-between gap-3">
                                                <span className="text-xs font-medium text-stone-700 truncate">
                                                    {ingrediente.nombre}
                                                </span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    value={cantidades[ingrediente.id] ?? ''}
                                                    onChange={(e) =>
                                                        setCantidades((prev) => ({
                                                            ...prev,
                                                            [ingrediente.id]: e.target.value,
                                                        }))
                                                    }
                                                    className="w-20 px-2.5 py-1.5 text-xs text-center bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#1e6044] text-stone-800 placeholder-stone-400"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-3 pt-3">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="bg-[#1e6044] hover:bg-[#164833] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                                    >
                                        {isSaving ? 'Guardando...' : 'Guardar batido'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 bg-[#e62107] py-2 text-xs font-semibold text-white hover:bg-[#c41a00] rounded-xl transition-colors cursor-pointer"
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
