// ─────────────────────────────────────────────────────────────
// adminService.ts — version statique (sans backend)
// Les données sont persistées dans localStorage pour la démo.
// En production, remplacer par des appels Supabase ou une API.
// ─────────────────────────────────────────────────────────────

export interface DashboardData {
  totalProjects:  number;
  avgSavings:     string;
  quoteRequests:  number;
  satisfaction:   string;
  growth:         { month: string; projects: number }[];
  distribution:   { label: string; value: number }[];
  recentProjects: { id: string; name: string; client: string; status: string; date: string }[];
  loginAttempts:  { email: string; timestamp: string; status: string; ip: string }[];
}

// ── Données statiques du dashboard ───────────────────────────
const STATIC_DASHBOARD: DashboardData = {
  totalProjects:  47,
  avgSavings:     '68%',
  quoteRequests:  12,
  satisfaction:   '98%',
  growth: [
    { month: 'Jan', projects: 4 },
    { month: 'Fév', projects: 6 },
    { month: 'Mar', projects: 5 },
    { month: 'Avr', projects: 8 },
    { month: 'Mai', projects: 11 },
    { month: 'Jun', projects: 13 },
  ],
  distribution: [
    { label: 'Résidentiel', value: 58 },
    { label: 'Commercial',  value: 27 },
    { label: 'Agricole',    value: 15 },
  ],
  recentProjects: [
    { id: '1', name: 'Villa Moderne',      client: 'M. Nguenon',    status: 'Terminé',    date: '2026-04-15' },
    { id: '2', name: 'Hôtel Boali',        client: 'SCI Boali',     status: 'En cours',   date: '2026-04-20' },
    { id: '3', name: 'Clinique Mbata',     client: 'Dr Koyaka',     status: 'Planifié',   date: '2026-05-02' },
    { id: '4', name: 'Ferme Lobaye',       client: 'Agri Centrafr.',status: 'Terminé',    date: '2026-03-28' },
    { id: '5', name: 'École de Bimbo',     client: 'Mairie Bimbo',  status: 'En cours',   date: '2026-04-10' },
  ],
  loginAttempts: [
    { email: 'jehubin@gmail.com', timestamp: new Date().toISOString(), status: 'Succès', ip: '—' },
  ],
};

export const fetchDashboardData = async (): Promise<DashboardData> => {
  await new Promise(r => setTimeout(r, 300));
  return STATIC_DASHBOARD;
};

// ── Posts (blog) — stockés en localStorage ───────────────────

const POSTS_KEY = 'sol_posts';

const DEFAULT_POSTS = [
  {
    id: 1,
    title: 'Comment choisir la puissance de son kit solaire ?',
    excerpt: 'Calculer ses besoins est la première étape vers l\'autonomie.',
    date: '12 Avril 2026',
    author: 'Ing. Moussa',
    image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=60&w=800',
    images: ['https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=60&w=800'],
    category: 'Guides',
  },
  {
    id: 2,
    title: 'Le solaire en RCA : Quel avenir ?',
    excerpt: 'L\'état des lieux de la transition énergétique en Centrafrique.',
    date: '05 Avril 2026',
    author: 'Direction SOL!',
    image: 'https://images.unsplash.com/photo-1466611653911-95282ee36567?auto=format&fit=crop&q=60&w=800',
    images: ['https://images.unsplash.com/photo-1466611653911-95282ee36567?auto=format&fit=crop&q=60&w=800'],
    category: 'Actualités',
  },
];

const loadPosts = () => {
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_POSTS;
  } catch { return DEFAULT_POSTS; }
};
const savePosts = (posts: any[]) => localStorage.setItem(POSTS_KEY, JSON.stringify(posts));

export const fetchPosts = async () => {
  await new Promise(r => setTimeout(r, 200));
  return loadPosts();
};
export const createPost = async (post: any) => {
  const posts = loadPosts();
  const newPost = { ...post, id: Date.now() };
  savePosts([...posts, newPost]);
  return newPost;
};
export const updatePost = async (id: number, post: any) => {
  const posts = loadPosts().map((p: any) => p.id === id ? { ...p, ...post } : p);
  savePosts(posts);
  return post;
};
export const deletePost = async (id: number) => {
  savePosts(loadPosts().filter((p: any) => p.id !== id));
  return { ok: true };
};

// ── Projects — stockés en localStorage ───────────────────────

const PROJECTS_KEY = 'sol_projects';

const DEFAULT_PROJECTS = [
  {
    id: '1', title: 'Villa Moderne - Bangui', category: 'residential',
    image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=1200',
    images: ['https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=1200'],
    roi: 'Économies: 600.000 FCFA/an',
    description: 'Autonomie complète pour une famille de 6 personnes.',
  },
  {
    id: '2', title: 'Hôtel Solaire - Boali', category: 'commercial',
    image: 'https://images.unsplash.com/photo-1466611653911-95282ee36567?auto=format&fit=crop&q=80&w=1200',
    images: ['https://images.unsplash.com/photo-1466611653911-95282ee36567?auto=format&fit=crop&q=80&w=1200'],
    roi: 'Économies: 2.4M FCFA/an',
    description: 'Installation industrielle pour hôtel 80 chambres.',
  },
];

const loadProjects = () => {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_PROJECTS;
  } catch { return DEFAULT_PROJECTS; }
};
const saveProjects = (projects: any[]) => localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));

export const fetchProjects = async () => {
  await new Promise(r => setTimeout(r, 200));
  return loadProjects();
};
export const createProject = async (project: any) => {
  const projects = loadProjects();
  const newProject = { ...project, id: String(Date.now()) };
  saveProjects([...projects, newProject]);
  return newProject;
};
export const updateProject = async (id: string, project: any) => {
  const projects = loadProjects().map((p: any) => p.id === id ? { ...p, ...project } : p);
  saveProjects(projects);
  return project;
};
export const deleteProject = async (id: string) => {
  saveProjects(loadProjects().filter((p: any) => p.id !== id));
  return { ok: true };
};

// ── Comments — stockés en localStorage ───────────────────────

const COMMENTS_KEY = 'sol_comments';
const loadComments = () => {
  try { return JSON.parse(localStorage.getItem(COMMENTS_KEY) || '[]'); } catch { return []; }
};
const saveComments = (c: any[]) => localStorage.setItem(COMMENTS_KEY, JSON.stringify(c));

export const fetchComments = async (postId?: number) => {
  await new Promise(r => setTimeout(r, 150));
  const all = loadComments();
  return postId ? all.filter((c: any) => c.postId === postId) : all;
};
export const createComment = async (comment: any) => {
  const comments = loadComments();
  const newComment = { ...comment, id: String(Date.now()) };
  saveComments([...comments, newComment]);
  return newComment;
};
export const deleteComment = async (id: string) => {
  saveComments(loadComments().filter((c: any) => c.id !== id));
  return { ok: true };
};

// ── Export CSV ────────────────────────────────────────────────

export const exportToCSV = (data: any[], fileName: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows    = data.map(row =>
    Object.values(row).map(val => typeof val === 'string' ? `"${val}"` : val).join(',')
  );
  const csv   = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
  const link  = document.createElement('a');
  link.href   = encodeURI(csv);
  link.download = `${fileName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ── Kept for compatibility (no longer used for auth) ─────────
export const adminLogin = async (_email: string, _password: string) => {
  throw new Error('Utiliser useAuth().login() à la place.');
};
