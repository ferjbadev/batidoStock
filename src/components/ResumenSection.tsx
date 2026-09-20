import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase, type Ingrediente, type Venta } from '../lib/supabase';

interface HistoryItem {
    id: string;
    type: 'sale' | 'ingredient';
    title: string;
    detail: string;
    time: string;
    amount?: string;
    date: Date;
}

interface WeeklyHistory {
    id: string;
    weekLabel: string;
    dateRange: string;
    items: HistoryItem[];
}

// Lunes como primer día de la semana.
const startOfWeek = (date: Date) => {
    const monday = new Date(date);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
};

const shortDate = (date: Date) =>
    date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

const relativeTime = (date: Date) => {
    const time = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return `Hoy, ${time}`;
    if (date.toDateString() === yesterday.toDateString()) return `Ayer, ${time}`;
    return `${shortDate(date)}, ${time}`;
};

const groupByWeek = (items: HistoryItem[]): WeeklyHistory[] => {
    const thisWeek = startOfWeek(new Date()).getTime();
    const weeks = new Map<number, HistoryItem[]>();

    for (const item of items) {
        const key = startOfWeek(item.date).getTime();
        const bucket = weeks.get(key);
        if (bucket) bucket.push(item);
        else weeks.set(key, [item]);
    }

    return [...weeks.entries()]
        .sort(([a], [b]) => b - a)
        .map(([key, weekItems]) => {
            const monday = new Date(key);
            const sunday = new Date(key);
            sunday.setDate(sunday.getDate() + 6);

            const weeksAgo = Math.round((thisWeek - key) / (7 * 24 * 60 * 60 * 1000));

            return {
                id: `week-${key}`,
                weekLabel:
                    weeksAgo === 0
                        ? 'Esta Semana'
                        : weeksAgo === 1
                          ? 'Semana Anterior'
                          : `Hace ${weeksAgo} semanas`,
                dateRange: `${shortDate(monday)} - ${shortDate(sunday)}`,
                items: weekItems.sort((a, b) => b.date.getTime() - a.date.getTime()),
            };
        });
};

// Subcomponente aislado para evitar colisiones de animación en el DOM
const ActivityCard = ({
    item,
    delayIndex,
}: {
    item: HistoryItem;
    delayIndex: number;
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.25,
                delay: delayIndex * 0.05,
                ease: 'easeOut',
            }}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-stone-100 hover:bg-stone-50 transition-colors gap-3 cursor-pointer"
        >
            <div className="flex items-start gap-3">
                <div
                    className={`p-2 rounded-xl text-xs shrink-0 ${item.type === 'sale'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                >
                    {item.type === 'sale' ? '🛍️' : '📦'}
                </div>

                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900 text-xs">
                            {item.title}
                        </span>
                        <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.type === 'sale'
                                    ? 'bg-emerald-100/70 text-emerald-800'
                                    : 'bg-amber-100/70 text-amber-800'
                                }`}
                        >
                            {item.type === 'sale' ? 'Venta' : 'Ingrediente'}
                        </span>
                    </div>
                    <p className="text-xs text-stone-600">{item.detail}</p>
                </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-stone-100">
                <span className="text-[11px] text-stone-400">{item.time}</span>
                {item.amount && (
                    <span className="font-bold text-emerald-700 text-xs bg-emerald-50 px-2.5 py-1 rounded-lg">
                        {item.amount}
                    </span>
                )}
            </div>
        </motion.div>
    );
};

export const ResumenSection = () => {
    const [historyData, setHistoryData] = useState<WeeklyHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadHistory = async () => {
            const [ventas, inventario] = await Promise.all([
                supabase.from('ventas').select('*').order('created_at', { ascending: false }).limit(100),
                supabase.from('inventario').select('*').order('created_at', { ascending: false }).limit(100),
            ]);

            if (ventas.error || inventario.error) {
                setError('No se pudo cargar el historial.');
                setIsLoading(false);
                return;
            }

            const items: HistoryItem[] = [
                ...(ventas.data as Venta[]).map((venta) => ({
                    id: `venta-${venta.id}`,
                    type: 'sale' as const,
                    title: 'Venta registrada',
                    detail: `${venta.cantidad}x ${venta.producto}`,
                    time: relativeTime(new Date(venta.created_at)),
                    amount: `+$${Number(venta.total).toFixed(2)}`,
                    date: new Date(venta.created_at),
                })),
                ...(inventario.data as Ingrediente[]).map((ingrediente) => ({
                    id: `ingrediente-${ingrediente.id}`,
                    type: 'ingredient' as const,
                    title: 'Ingrediente agregado',
                    detail: `${ingrediente.nombre} (${ingrediente.stock} unidades iniciales)`,
                    time: relativeTime(new Date(ingrediente.created_at)),
                    date: new Date(ingrediente.created_at),
                })),
            ];

            setHistoryData(groupByWeek(items));
            setIsLoading(false);
        };

        loadHistory();
    }, []);

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans text-stone-800">
            <div>
                <h2 className="text-xl font-bold text-stone-900">Historial de Actividad</h2>
                <p className="text-sm text-stone-500">
                    Para que no se te olvide nada mi amor
                </p>
            </div>

            {error && (
                <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2.5">
                    {error}
                </div>
            )}

            {isLoading ? (
                <p className="text-center text-sm text-stone-400 py-8">Cargando historial...</p>
            ) : historyData.length === 0 ? (
                <p className="text-center text-sm text-stone-400 py-8">
                    Todavía no hay actividad que mostrar.
                </p>
            ) : (
                <div className="space-y-6">
                    {historyData.map((week, weekIdx) => (
                        <motion.div
                            key={week.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: weekIdx * 0.1 }}
                            className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-4"
                        >
                            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                                <h3 className="font-bold text-stone-900 text-sm">{week.weekLabel}</h3>
                                <span className="text-xs font-medium text-stone-400 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-100">
                                    {week.dateRange}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {week.items.map((item, itemIdx) => (
                                    <ActivityCard
                                        key={item.id}
                                        item={item}
                                        delayIndex={weekIdx * 4 + itemIdx}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
