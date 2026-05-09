import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

const app = express();
const PORT = 3000;

app.use(express.json());

// Simulated Hardcoded Credentials (In a real app, use Hashed Passwords and a DB)
const ADMIN_CREDENTIALS = {
  email: 'admin@sol.rca',
  password: 'bangui2026'
};

// Simple in-memory storage for content
const posts = [
  {
    id: 1,
    title: "Comment choisir la puissance de son kit solaire ?",
    excerpt: "Calculer ses besoins est la première étape vers l'autonomie. Découvrez notre guide simple.",
    date: "12 Avril 2026",
    author: "Ing. Moussa",
    image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=60&w=800",
    images: [
      "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=60&w=800",
      "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?auto=format&fit=crop&q=60&w=800",
      "https://images.unsplash.com/photo-1466611653911-95282ee36567?auto=format&fit=crop&q=60&w=800"
    ],
    category: "Guides"
  },
  {
    id: 2,
    title: "Le solaire en RCA : Quel avenir pour l'énergie ?",
    excerpt: "L'état des lieux de la transition énergétique en Centrafrique et les opportunités pour 2026.",
    date: "05 Avril 2026",
    author: "Direction SOL!",
    image: "https://images.unsplash.com/photo-1466611653911-95282ee36567?auto=format&fit=crop&q=60&w=800",
    images: [
      "https://images.unsplash.com/photo-1466611653911-95282ee36567?auto=format&fit=crop&q=60&w=800",
      "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&q=60&w=800"
    ],
    category: "Actualités"
  },
  {
    id: 3,
    title: "Entretien de vos panneaux : 5 conseils d'experts",
    excerpt: "Un panneau propre est un panneau qui produit. Apprenez les bons gestes pour Bangui.",
    date: "28 Mars 2026",
    author: "Service Maintenance",
    image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=60&w=800",
    images: [
      "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=60&w=800",
      "https://images.unsplash.com/photo-1611365892117-00ac5ef437ea?auto=format&fit=crop&q=60&w=800"
    ],
    category: "Entretien"
  }
];

const projects = [
  {
    id: '1',
    title: 'Villa Moderne - Bangui',
    category: 'residential',
    image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=1200',
    images: [
      'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&q=80&w=1200'
    ],
    roi: 'Économies: 600.000 FCFA/an',
    description: 'Autonomie complète pour une famille de 6 personnes avec un système hybride gérant les coupures nocturnes.',
  },
  {
    id: '2',
    title: 'Hôtel Solaire - Boali',
    category: 'commercial',
    image: 'https://images.unsplash.com/photo-1466611653911-95282ee36567?auto=format&fit=crop&q=80&w=1200',
    images: [
      'https://images.unsplash.com/photo-1466611653911-95282ee36567?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&q=80&w=1200'
    ],
    roi: 'Économies: 2.500.000 FCFA/an',
    description: 'Un système hybride industriel permettant de maintenir la climatisation et l\'éclairage extérieur sans interruption.',
  }
];

// In-memory storage for login attempts and brute-force protection
const loginAttempts: any[] = [];
const failedAttemptsMap = new Map<string, { count: number; lastAttempt: number }>();

// Middleware to check admin token
const checkAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Non autorisé." });
  }
  // Simplified validation for demo purposes
  next();
};

// Comments storage
const comments: any[] = [];

// API routes
app.get("/api/posts", (req, res) => res.json(posts));
app.get("/api/projects", (req, res) => res.json(projects));

app.get("/api/comments/:postId", (req, res) => {
  const { postId } = req.params;
  const filteredComments = comments.filter(c => c.postId === parseInt(postId));
  res.json(filteredComments);
});

app.post("/api/comments", (req, res) => {
  const newComment = { 
    ...req.body, 
    id: Date.now().toString(), 
    date: new Date().toISOString() 
  };
  comments.unshift(newComment);
  res.json(newComment);
});

app.get("/api/admin/comments", checkAdmin, (req, res) => {
  res.json(comments);
});

app.delete("/api/admin/comments/:id", checkAdmin, (req, res) => {
  const { id } = req.params;
  const index = comments.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: "Commentaire non trouvé" });
  comments.splice(index, 1);
  res.json({ success: true });
});

app.post("/api/admin/posts", checkAdmin, (req, res) => {
  const newPost = { ...req.body, id: Date.now(), date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) };
  posts.unshift(newPost);
  res.json(newPost);
});

app.put("/api/admin/posts/:id", checkAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const index = posts.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: "Post non trouvé" });
  posts[index] = { ...posts[index], ...req.body };
  res.json(posts[index]);
});

app.delete("/api/admin/posts/:id", checkAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const index = posts.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: "Post non trouvé" });
  posts.splice(index, 1);
  res.json({ success: true });
});

app.post("/api/admin/projects", checkAdmin, (req, res) => {
  const newProject = { ...req.body, id: Date.now().toString() };
  projects.unshift(newProject);
  res.json(newProject);
});

app.put("/api/admin/projects/:id", checkAdmin, (req, res) => {
  const { id } = req.params;
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: "Projet non trouvé" });
  projects[index] = { ...projects[index], ...req.body };
  res.json(projects[index]);
});

app.delete("/api/admin/projects/:id", checkAdmin, (req, res) => {
  const { id } = req.params;
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: "Projet non trouvé" });
  projects.splice(index, 1);
  res.json({ success: true });
});

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || 'unknown';
  
  // Brute force protection: check if blocked
  const failed = failedAttemptsMap.get(ip);
  if (failed && failed.count >= 5 && Date.now() - failed.lastAttempt < 600000) { // 10 minutes block
    const remainingTime = Math.ceil((600000 - (Date.now() - failed.lastAttempt)) / 60000);
    return res.status(429).json({ 
      error: `Trop de tentatives. Veuillez attendre ${remainingTime} minutes.` 
    });
  }

  const isSuccess = email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;

  // Log attempt
  loginAttempts.unshift({
    email,
    timestamp: new Date().toISOString(),
    status: isSuccess ? 'Succès' : 'Échec',
    ip
  });

  if (isSuccess) {
    failedAttemptsMap.delete(ip); // Reset on success
    const token = Buffer.from(JSON.stringify({ sub: email, exp: Date.now() + 3600000 })).toString('base64');
    return res.json({ token, user: { email } });
  }

  // Update failed attempts
  const current = failedAttemptsMap.get(ip) || { count: 0, lastAttempt: 0 };
  failedAttemptsMap.set(ip, { count: current.count + 1, lastAttempt: Date.now() });

  return res.status(401).json({ error: "Identifiants invalides." });
});

app.get("/api/admin/dashboard", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Non autorisé." });
  }

  // Simulate data fetching delay
  setTimeout(() => {
    res.json({
      totalProjects: 254,
      avgSavings: "450 000 FCFA",
      quoteRequests: 48,
      satisfaction: "98.5%",
      growth: [
        { month: 'Jan', projects: 20 },
        { month: 'Fév', projects: 25 },
        { month: 'Mar', projects: 22 },
        { month: 'Avr', projects: 30 },
        { month: 'Mai', projects: 35 },
        { month: 'Juin', projects: 48 },
        { month: 'Juil', projects: 42 },
        { month: 'Août', projects: 55 },
        { month: 'Sept', projects: 50 },
        { month: 'Oct', projects: 65 },
        { month: 'Nov', projects: 60 },
        { month: 'Déc', projects: 74 },
      ],
      distribution: [
        { label: 'Résidentiel', value: 65 },
        { label: 'Commercial', value: 25 },
        { label: 'Institutionnel', value: 10 },
      ],
      recentProjects: [
        { id: '101', name: 'Villa Bangui Nord', client: 'M. Kondogbia', status: 'Terminé', date: '2026-04-12' },
        { id: '102', name: 'Centre Medical Bimbo', client: 'ONG Santé+', status: 'En cours', date: '2026-04-15' },
        { id: '103', name: 'Epicerie Boali', client: 'Mme Touadera', status: 'Plannifié', date: '2026-04-20' },
        { id: '104', name: 'Ecole Primaire Gobongo', client: 'Mairie de Bangui', status: 'Terminé', date: '2026-04-05' },
        { id: '105', name: 'Station Pompage Boali 2', client: 'SODECA', status: 'En cours', date: '2026-04-18' },
      ],
      loginAttempts: loginAttempts.slice(0, 10)
    });
  }, 1000);
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
