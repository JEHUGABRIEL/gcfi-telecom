import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

// Next.js dérive la racine des fichiers spéciaux de `pagesDir || appDir`
// (`rootDir = <appDir>/..`). Comme l'App Router est dans `src/app`, il ne cherche
// `middleware` et `instrumentation` que dans `src/`. Un fichier placé à la racine du
// dépôt est silencieusement ignoré : le build reste vert, mais il n'est jamais compilé
// (aucune protection de routes / rôle / MFA / APP_MODE, aucun hook d'instrumentation).
const EXTENSIONS = ['ts', 'tsx', 'js', 'jsx'];

const filesAt = (dir: string, name: string) =>
  EXTENSIONS.filter((ext) => existsSync(join(dir, `${name}.${ext}`)));

describe('fichiers spéciaux Next', () => {
  it('is compiled from src/middleware.ts', () => {
    expect(
      existsSync(join(SRC, 'middleware.ts')),
      'src/middleware.ts doit exister : Next ne compile pas un middleware placé à la racine quand l’App Router est dans src/app.'
    ).toBe(true);
  });

  it('is not left at the repository root, where Next would ignore it', () => {
    const misplaced = filesAt(ROOT, 'middleware');

    expect(
      misplaced,
      `middleware à la racine détecté (${misplaced.join(', ')}) : avec l’App Router dans src/app, Next l’ignore et la protection ne s’exécute jamais. Déplace-le vers src/middleware.ts.`
    ).toEqual([]);
  });

  it('keeps instrumentation out of the repository root, where Next would ignore it', () => {
    const misplaced = filesAt(ROOT, 'instrumentation');

    expect(
      misplaced,
      `instrumentation à la racine détecté (${misplaced.join(', ')}) : même règle de résolution que le middleware, Next l’ignore. Place-le dans src/instrumentation.ts.`
    ).toEqual([]);
  });
});
