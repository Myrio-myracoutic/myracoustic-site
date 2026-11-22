// Le cœur du module d'appels externes existe en deux exemplaires (site et plateforme, deux
// dépôts déployés séparément). Ce test échoue dès qu'ils divergent : modifier les deux ensemble.
// Ignoré si le dossier plateforme/ n'est pas à côté (ex. copie isolée du site).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const copies = [
  ['app/lib/api-externe-core.js', '../plateforme/lib/api-externe-core.js'],
  ['app/lib/html-escape.js', '../plateforme/lib/html-escape.js'],
];

for (const [site, plateforme] of copies) {
  const cheminPlateforme = path.join(ici, '..', plateforme);
  test(`${site} identique à plateforme/${plateforme.replace('../plateforme/', '')}`, { skip: !fs.existsSync(cheminPlateforme) }, () => {
    assert.equal(fs.readFileSync(path.join(ici, '..', site), 'utf8'), fs.readFileSync(cheminPlateforme, 'utf8'));
  });
}
