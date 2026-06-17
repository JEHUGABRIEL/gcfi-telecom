'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import {
  ShoppingBag, Users, Wrench, BookOpen, Tag, Bell,
  FileText, Newspaper, RefreshCw, Package
} from 'lucide-react';
import { useLang } from '@/shared/context/LanguageContext';

interface OverviewTabProps {
  onNavigate: (tab: string) => void;
}

const ENTITY_META: Record<string, { icon: React.ElementType; color: string; tab: string }> = {
  services:      { icon: Wrench,      color: 'text-red-500',     tab: 'services' },
  products:      { icon: Package,     color: 'text-orange-500',  tab: 'produits' },
  trainings:     { icon: BookOpen,    color: 'text-blue-500',    tab: 'formations' },
  blog:          { icon: Newspaper,   color: 'text-violet-500',  tab: 'blog' },
  users:         { icon: Users,       color: 'text-emerald-500', tab: 'users' },
  orders:        { icon: ShoppingBag, color: 'text-amber-500',   tab: 'orders' },
  promos:        { icon: Tag,         color: 'text-pink-500',    tab: 'promotions' },
  notifications: { icon: Bell,        color: 'text-sky-500',     tab: 'notifications' },
  quotes:        { icon: FileText,    color: 'text-teal-500',    tab: 'devis' },
  content:       { icon: FileText,    color: 'text-slate-500',   tab: 'partenaires' },
};

function timeAgo(dateStr: string, prefix: string, suffix: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const fmt = (val: number, unit: string) => [prefix, `${val}${unit}`, suffix].filter(Boolean).join(' ');
  if (diff < 60)   return fmt(diff, 's');
  if (diff < 3600) return fmt(Math.floor(diff / 60), 'min');
  if (diff < 86400) return fmt(Math.floor(diff / 3600), 'h');
  return fmt(Math.floor(diff / 86400), 'j');
}

export default function OverviewTab({ onNavigate }: OverviewTabProps) {
  const { t } = useLang();
  const ap = t.admin_page;
  const { data: activities = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'activity_log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) return [];
      return data || [];
    },
    refetchInterval: 30_000, // actualise toutes les 30s
    staleTime: 15_000,
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">{ap.overview_title}</h3>
          <button
            onClick={() => refetch()}
            className="p-2 text-slate-400 hover:text-[#C1272D] transition-colors"
            title={ap.overview_refresh}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-sm">{ap.overview_empty}</p>
            <p className="text-xs mt-1 opacity-70">{ap.overview_empty_hint}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity: { id: string; entity: string; label: string; admin_name?: string; created_at: string }) => {
              const meta = ENTITY_META[activity.entity] ?? ENTITY_META['content'];
              const Icon = meta.icon;
              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {activity.label}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400">{timeAgo(activity.created_at, ap.overview_time_prefix, ap.overview_time_suffix)}</p>
                      {activity.admin_name && (
                        <>
                          <span className="text-slate-200 dark:text-slate-600">•</span>
                          <p className="text-xs text-slate-400 truncate">{activity.admin_name}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate(meta.tab)}
                    className="text-[10px] font-black uppercase tracking-widest text-[#C1272D] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    {ap.overview_view}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}