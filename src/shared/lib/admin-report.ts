// Génère et télécharge un rapport de gestion au format PDF (côté client).
// Les librairies sont importées dynamiquement pour rester SSR-safe.

export interface ReportData {
  users: Record<string, any>[];
  orders: Record<string, any>[];
  trainings: Record<string, any>[];
  products: Record<string, any>[];
}

const RED: [number, number, number] = [193, 39, 45];

export async function downloadAdminReport(data: ReportData, labels: Record<string, string>) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const now = new Date();
  const fmtDate = (d: Date) =>
    d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  const fmtNum = (n: number) => n.toLocaleString('fr-FR');
  const money = (n: number) => `${fmtNum(n)} FCFA`;

  const monthlyRevenue = data.orders
    .filter((o) => {
      const d = new Date(o.created_at);
      return o.status === 'completed' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, o) => sum + (Number(o.total_amount) || Number(o.total) || 0), 0);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Bandeau d'en-tête
  doc.setFillColor(...RED);
  doc.rect(0, 0, pageWidth, 90, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('GCFI Telecom', 40, 40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(labels.report_title || 'Rapport de gestion', 40, 62);
  doc.setFontSize(9);
  doc.text(`${labels.report_generated || 'Généré le'} : ${fmtDate(now)}`, 40, 78);

  // Synthèse
  let y = 120;
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(labels.report_summary || 'Synthèse', 40, y);
  y += 26;
  const stats: [string, string][] = [
    [labels.stat_users || 'Utilisateurs', fmtNum(data.users.length)],
    [labels.stat_orders || 'Commandes', fmtNum(data.orders.length)],
    [labels.stat_active_courses || 'Cours actifs', fmtNum(data.trainings.length)],
    [labels.stat_monthly_revenue || 'Revenu mensuel', money(monthlyRevenue)],
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  stats.forEach(([label, value]) => {
    doc.setTextColor(120, 120, 120);
    doc.text(label, 40, y);
    doc.setTextColor(...RED);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 200, y);
    doc.setFont('helvetica', 'normal');
    y += 18;
  });

  const headStyles = { fillColor: RED, fontSize: 9, fontStyle: 'bold' as const };
  const bodyStyles = { fontSize: 9 };

  // Commandes
  autoTable(doc, {
    startY: y + 12,
    theme: 'striped',
    headStyles,
    styles: bodyStyles,
    head: [[labels.report_orders_table || 'Dernières commandes', labels.order_date || 'Date', labels.order_total || 'Total', labels.users_label_status || 'Statut']],
    body: data.orders.slice(0, 15).map((o) => [
      String(o.id || '').slice(0, 8),
      o.created_at ? fmtDate(new Date(o.created_at)) : '',
      money(Number(o.total_amount) || Number(o.total) || 0),
      String(o.status || ''),
    ]),
  });

  // Utilisateurs
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    theme: 'striped',
    headStyles,
    styles: bodyStyles,
    head: [[labels.report_users_table || 'Utilisateurs', labels.users_label_email || 'Email', labels.users_label_role || 'Rôle', labels.users_label_status || 'Statut']],
    body: data.users.slice(0, 20).map((u) => [
      u.full_name || '—',
      u.email || '',
      String(u.role || ''),
      u.is_blocked ? 'Bloqué' : 'Actif',
    ]),
  });

  // Formations
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    theme: 'striped',
    headStyles,
    styles: bodyStyles,
    head: [[labels.report_trainings_table || 'Formations', labels.product_category || 'Catégorie', labels.product_price || 'Prix', labels.modal_field_duration || 'Durée']],
    body: data.trainings.slice(0, 20).map((tr) => [
      tr.title || '',
      String(tr.category || ''),
      money(Number(tr.price) || 0),
      String(tr.duration || ''),
    ]),
  });

  // Produits
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    theme: 'striped',
    headStyles,
    styles: bodyStyles,
    head: [[labels.report_products_table || 'Produits', labels.product_category || 'Catégorie', labels.product_price || 'Prix', labels.product_stock || 'Stock']],
    body: data.products.slice(0, 20).map((p) => [
      p.name || '',
      String(p.category || ''),
      money(Number(p.price) || 0),
      String(p.stock ?? 0),
    ]),
  });

  doc.save(`rapport-gcfi-${now.toISOString().slice(0, 10)}.pdf`);
}