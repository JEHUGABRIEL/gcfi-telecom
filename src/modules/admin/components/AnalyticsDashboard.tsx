import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, ShoppingCart, Eye, Calendar } from 'lucide-react';
import { getAnalyticsMetrics } from '@/shared/lib/analytics-service';
import type { AnalyticsMetrics } from '@/shared/lib/analytics-service';

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = React.useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [days, setDays] = React.useState(30);

  React.useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      const data = await getAnalyticsMetrics(days);
      setMetrics(data);
      setLoading(false);
    };
    fetchMetrics();
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#C1272D] rounded-full animate-spin" />
      </div>
    );
  }

  if (!metrics) return null;

  const stats = [
    { label: 'Vues de page', value: metrics.pageViews, icon: Eye, color: 'bg-blue-100 dark:bg-blue-900/20' },
    { label: 'Utilisateurs uniques', value: metrics.uniqueUsers, icon: Users, color: 'bg-green-100 dark:bg-green-900/20' },
    { label: 'Taux conversion', value: `${metrics.conversionRate}%`, icon: TrendingUp, color: 'bg-purple-100 dark:bg-purple-900/20' },
    { label: 'Commandes', value: metrics.topEvents.find(e => e.event === 'purchase')?.count || 0, icon: ShoppingCart, color: 'bg-red-100 dark:bg-red-900/20' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h2>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                days === d
                  ? 'bg-[#C1272D] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {d}j
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6"
            >
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Top pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Pages populaires</h3>
          <div className="space-y-3">
            {metrics.topPages.length > 0 ? (
              metrics.topPages.map((page, i) => (
                <div key={page.page} className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-[#C1272D]">{i + 1}</span>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{page.page}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{page.views}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Pas de données</p>
            )}
          </div>
        </div>

        {/* Top events */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Événements</h3>
          <div className="space-y-3">
            {metrics.topEvents.length > 0 ? (
              metrics.topEvents.map((event, i) => (
                <div key={event.event} className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-[#C1272D]">{i + 1}</span>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">{event.event}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{event.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Pas de données</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}