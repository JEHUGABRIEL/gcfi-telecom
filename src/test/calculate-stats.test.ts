import { describe, it, expect } from 'vitest';

/* ── Logique de calculateStats() extraite en fonction pure ──── */

interface StatOrder {
  id: string;
  created_at: string;
  status: string;
  total_amount?: number;
  total?: number;
}

interface StatResult {
  label: string;
  value: string;
  change: string;
}

function calculateStats(
  users: unknown[],
  orders: StatOrder[],
  trainings: unknown[],
  labels: { users: string; orders: string; courses: string; revenue: string },
  /** Override "now" for deterministic testing */
  now?: Date,
): StatResult[] {
  const totalUsers = users.length;
  const totalOrders = orders.length;
  const activeTrainings = trainings.length;

  const date = now ?? new Date();
  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();

  const monthlyRevenue = orders
    .filter((o) => {
      const orderDate = new Date(o.created_at);
      return (
        o.status === 'completed' &&
        orderDate.getMonth() === currentMonth &&
        orderDate.getFullYear() === currentYear
      );
    })
    .reduce(
      (sum, o) => sum + (Number(o.total_amount) || Number(o.total) || 0),
      0,
    );

  return [
    { label: labels.users, value: totalUsers.toLocaleString(), change: '+12%' },
    { label: labels.orders, value: totalOrders.toLocaleString(), change: '+8%' },
    { label: labels.courses, value: activeTrainings.toLocaleString(), change: '0%' },
    {
      label: labels.revenue,
      value: `${(monthlyRevenue / 1000).toFixed(1)}k F`,
      change: '+15%',
    },
  ];
}

/* ── Helpers pour fabriquer des dates déterministes ─────────── */
function dateStr(year: number, month: number, day = 1): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T10:00:00Z`;
}

/* ── Étiquettes factices ────────────────────────────────────── */
const LABELS = {
  users: 'Utilisateurs',
  orders: 'Commandes',
  courses: 'Cours Actifs',
  revenue: 'Revenu Mensuel',
};

/* ══════════════════════════════════════════════════════════════ */
describe('calculateStats', () => {
  /* ── Scénario : données vides ─────────────────────────────── */
  it('retourne des stats à zéro quand les tableaux sont vides', () => {
    const stats = calculateStats([], [], [], LABELS, new Date(2025, 5, 15));
    expect(stats).toHaveLength(4);
    expect(stats[0]).toMatchObject({ label: LABELS.users, value: '0' });
    expect(stats[1]).toMatchObject({ label: LABELS.orders, value: '0' });
    expect(stats[2]).toMatchObject({ label: LABELS.courses, value: '0' });
    expect(stats[3]).toMatchObject({ label: LABELS.revenue, value: '0.0k F' });
  });

  /* ── Scénario : comptage simple ───────────────────────────── */
  it('compte correctement les utilisateurs, commandes et formations', () => {
    const users = Array.from({ length: 3 }, (_, i) => ({ id: `u${i}` }));
    const trainings = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}` }));
    const stats = calculateStats(users, [], trainings, LABELS, new Date(2025, 5, 15));

    expect(stats[0]).toMatchObject({ value: '3' });   // users
    expect(stats[1]).toMatchObject({ value: '0' });   // orders
    expect(stats[2]).toMatchObject({ value: '5' });   // trainings
  });

  /* ── Scénario : revenu mensuel avec commandes complétées ──── */
  it('calcule le revenu mensuel à partir des commandes complétées du mois en cours', () => {
    const now = new Date(2025, 5, 15); // juin 2025
    const orders: StatOrder[] = [
      { id: 'o1', created_at: dateStr(2025, 5, 10), status: 'completed', total_amount: 150000 },
      { id: 'o2', created_at: dateStr(2025, 5, 12), status: 'completed', total_amount: 50000 },
    ];

    const stats = calculateStats([], orders, [], LABELS, now);
    expect(stats[3]).toMatchObject({ value: '200.0k F' }); // 200 000 FCFA
  });

  /* ── Scénario : exclusion des commandes non complétées ────── */
  it("exclut les commandes qui ne sont pas au statut 'completed'", () => {
    const now = new Date(2025, 5, 15);
    const orders: StatOrder[] = [
      { id: 'o1', created_at: dateStr(2025, 5, 10), status: 'En préparation', total_amount: 50000 },
      { id: 'o2', created_at: dateStr(2025, 5, 12), status: 'Expédiée', total_amount: 50000 },
      { id: 'o3', created_at: dateStr(2025, 5, 8),  status: 'completed', total_amount: 100000 },
    ];

    const stats = calculateStats([], orders, [], LABELS, now);
    expect(stats[3]).toMatchObject({ value: '100.0k F' }); // seule o3 comptée
  });

  /* ── Scénario : exclusion des mois antérieurs ─────────────── */
  it("exclut les commandes complétées des mois précédents", () => {
    const now = new Date(2025, 5, 15); // juin 2025
    const orders: StatOrder[] = [
      { id: 'o1', created_at: dateStr(2025, 4, 20), status: 'completed', total_amount: 100000 }, // mai
      { id: 'o2', created_at: dateStr(2025, 5, 1),  status: 'completed', total_amount: 75000 },  // juin
    ];

    const stats = calculateStats([], orders, [], LABELS, now);
    expect(stats[3]).toMatchObject({ value: '75.0k F' }); // seule o2 comptée
  });

  /* ── Scénario : fallback total_amount → total → 0 ─────────── */
  it('utilise total_amount puis total puis 0 comme fallback', () => {
    const now = new Date(2025, 5, 15);
    const orders: StatOrder[] = [
      { id: 'o1', created_at: dateStr(2025, 5, 1), status: 'completed', total_amount: 100000 },
      { id: 'o2', created_at: dateStr(2025, 5, 2), status: 'completed', total: 50000 },          // fallback total
      { id: 'o3', created_at: dateStr(2025, 5, 3), status: 'completed' },                         // aucun → 0
    ];

    const stats = calculateStats([], orders, [], LABELS, now);
    expect(stats[3]).toMatchObject({ value: '150.0k F' }); // 100k + 50k + 0
  });

  /* ── Scénario : plusieurs centaines de milliers ────────────── */
  it('formate correctement les gros montants', () => {
    const now = new Date(2025, 5, 15);
    const orders: StatOrder[] = [
      { id: 'o1', created_at: dateStr(2025, 5, 1), status: 'completed', total_amount: 1250000 },
    ];

    const stats = calculateStats([], orders, [], LABELS, now);
    expect(stats[3]).toMatchObject({ value: '1250.0k F' });
  });

  /* ── Scénario : icônes et couleurs sont toujours présentes ── */
  it('retourne toujours les 4 stats avec les bonnes clés', () => {
    const stats = calculateStats([], [], [], LABELS, new Date(2025, 0, 1));
    expect(stats).toHaveLength(4);

    // Vérifie la structure minimale de chaque stat
    for (const s of stats) {
      expect(s).toHaveProperty('label');
      expect(s).toHaveProperty('value');
      expect(s).toHaveProperty('change');
      expect(typeof s.label).toBe('string');
      expect(typeof s.value).toBe('string');
      expect(typeof s.change).toBe('string');
    }

    // Vérifie l'ordre : users, orders, courses, revenue
    expect(stats[0].label).toBe(LABELS.users);
    expect(stats[1].label).toBe(LABELS.orders);
    expect(stats[2].label).toBe(LABELS.courses);
    expect(stats[3].label).toBe(LABELS.revenue);
  });

  /* ── Scénario : bords temporels (fin / début de mois) ─────── */
  it("gère les transitions de mois correctement", () => {
    const now = new Date(2025, 5, 30); // fin juin 2025
    const orders: StatOrder[] = [
      { id: 'o1', created_at: dateStr(2025, 5, 30), status: 'completed', total_amount: 100 },  // même jour
      { id: 'o2', created_at: dateStr(2025, 6, 1),  status: 'completed', total_amount: 200 },  // juillet → exclu
      { id: 'o3', created_at: dateStr(2025, 5, 1),  status: 'completed', total_amount: 300 },  // début juin
    ];

    const stats = calculateStats([], orders, [], LABELS, now);
    expect(stats[3]).toMatchObject({ value: '0.4k F' }); // 100 + 300 = 400
  });
});
