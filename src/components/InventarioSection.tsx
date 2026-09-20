import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, type Ingrediente } from '../lib/supabase';

export const InventarioSection = () => {
    const [ingredients, setIngredients] = useState<Ingrediente[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newIngredientName, setNewIngredientName] = useState('');
    const [newIngredientStock, setNewIngredientStock] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadIngredients = async () => {
            const { data, error } = await supabase
                .from('inventario')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) setError('No se pudo cargar el inventario.');
            else setIngredients(data);
            setIsLoading(false);
        };

        loadIngredients();
    }, []);

    const handleAddIngredient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newIngredientName.trim() || newIngredientStock === '') return;

        setIsSaving(true);
        const { data, error } = await supabase
            .from('inventario')
            .insert({ nombre: newIngredientName.trim(), stock: Number(newIngredientStock) })
            .select()
            .single();
        setIsSaving(false);

        if (error) {
            setError('No se pudo guardar el ingrediente.');
            return;
        }

        setIngredients((prev) => [...prev, data]);
        setNewIngredientName('');
        setNewIngredientStock('');
        setIsModalOpen(false);
    };

    const handleUpdateStock = async (item: Ingrediente, delta: number) => {
        const nuevoStock = item.stock + delta;
        if (nuevoStock < 0) return;

        // Actualización optimista: la UI responde al instante y se revierte si falla.
        setIngredients((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, stock: nuevoStock } : i))
        );

        const { error } = await supabase
            .from('inventario')
            .update({ stock: nuevoStock })
            .eq('id', item.id);

        if (error) {
            setError('No se pudo actualizar la cantidad.');
            setIngredients((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, stock: item.stock } : i))
            );
        }
    };

    const handleDeleteIngredient = async (item: Ingrediente) => {
        setIngredients((prev) => prev.filter((i) => i.id !== item.id));

        const { error } = await supabase.from('inventario').delete().eq('id', item.id);

        if (error) {
            setError('No se pudo eliminar el ingrediente.');
            setIngredients((prev) =>
                [...prev, item].sort((a, b) => a.created_at.localeCompare(b.created_at))
            );
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans text-stone-800">
            {/* Contenedor principal */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="w-full">
                        <h2 className="text-2xl text-center font-bold text-stone-900">
                            Inventario de Ingredientes
                        </h2>
                        <p className="text-base text-center text-stone-500">
                            Estate pendiente que no te quedes sin ingredientes por que yo se que tu eres tontita
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2.5">
                        {error}
                    </div>
                )}

                {/* Tabla */}
                {isLoading ? (
                    <p className="text-center text-sm text-stone-400 py-8">Cargando inventario...</p>
                ) : ingredients.length === 0 ? (
                    <p className="text-center text-sm text-stone-400 py-8">
                        Todavía no hay ingredientes. Añade el primero.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-stone-100 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                                    <th className="pb-3">Ingrediente</th>
                                    <th className="pb-3 text-right">Cantidad disponible</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 text-sm">
                                <AnimatePresence initial={false}>
                                    {ingredients.map((item) => (
                                        <motion.tr
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.25, ease: 'easeOut' }}
                                            className="hover:bg-stone-50/60 transition-colors"
                                        >
                                            <td className="py-4 font-bold text-stone-900">{item.nombre}</td>
                                            <td className="py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateStock(item, -1)}
                                                        disabled={item.stock === 0}
                                                        className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 font-bold hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                        aria-label={`Quitar una unidad de ${item.nombre}`}
                                                    >
                                                        −
                                                    </button>
                                                    <span className="font-semibold text-stone-800 min-w-[90px] text-center">
                                                        {item.stock} {item.stock === 1 ? 'unidad' : 'unidades'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateStock(item, 1)}
                                                        className="w-7 h-7 rounded-lg bg-[#eaf3de] text-[#1e6044] font-bold hover:bg-[#d8e8c5] transition-colors cursor-pointer"
                                                        aria-label={`Añadir una unidad de ${item.nombre}`}
                                                    >
                                                        +
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteIngredient(item)}
                                                        className="ml-1 p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                        aria-label={`Eliminar ${item.nombre}`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Botón inferior centrado */}
                <div className="pt-2 flex justify-center border-t border-stone-100">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#1e6044] hover:bg-[#164833] text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                        <span>+</span> Añadir ingrediente
                    </button>
                </div>
            </motion.div>

            {/* Modal para agregar ingrediente */}
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

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="relative z-10 bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-stone-100 space-y-5"
                        >
                            {/* Cabecera del modal con título centrado */}
                            <div className="relative flex items-center justify-center">
                                <h3 className="text-lg font-bold text-stone-900 text-center">
                                    Añadir nuevo ingrediente
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="absolute right-0 p-1 rounded-lg text-black hover:opacity-75 transition-opacity cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleAddIngredient} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-stone-600 mb-1">
                                        Nombre del ingrediente
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. Mango, Leche, Fresa"
                                        value={newIngredientName}
                                        onChange={(e) => setNewIngredientName(e.target.value)}
                                        className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#1e6044] text-stone-800 placeholder-stone-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-stone-600 mb-1">
                                        Cantidad disponible
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        placeholder="Ej. 10"
                                        value={newIngredientStock}
                                        onChange={(e) => setNewIngredientStock(e.target.value)}
                                        className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#1e6044] text-stone-800 placeholder-stone-400"
                                    />
                                </div>

                                {/* Botones del formulario centrados */}
                                <div className="flex items-center justify-center gap-3 pt-3">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="bg-[#1e6044] hover:bg-[#164833] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                                    >
                                        {isSaving ? 'Guardando...' : 'Guardar ingrediente'}
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
