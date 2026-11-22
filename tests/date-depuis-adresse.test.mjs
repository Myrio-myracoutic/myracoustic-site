// Date transmise par Aria dans l'adresse d'un formulaire (?date=AAAA-MM-JJ) : seules les vraies
// dates dans la plage autorisée sont reprises (app/lib/date-depuis-adresse.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { lireDateAdresse } from '../app/lib/date-depuis-adresse.js';

test('date valide dans la plage : reprise', () => {
  assert.equal(lireDateAdresse('?date=2027-09-18', '2026-11-22', '2028-11-22'), '2027-09-18');
  assert.equal(lireDateAdresse('?porte=app&date=2027-09-18', '2026-11-22', null), '2027-09-18');
});

test('date absente, mal formée ou impossible : ignorée', () => {
  assert.equal(lireDateAdresse('', '2026-11-22', null), null);
  assert.equal(lireDateAdresse('?date=18/09/2027', '2026-11-22', null), null);
  assert.equal(lireDateAdresse('?date=2027-02-30', '2026-11-22', null), null);
  assert.equal(lireDateAdresse('?date=2027-9-18', '2026-11-22', null), null);
  assert.equal(lireDateAdresse('?date=<script>', '2026-11-22', null), null);
});

test('date hors plage (passée ou trop lointaine) : ignorée', () => {
  assert.equal(lireDateAdresse('?date=2026-11-14', '2026-11-22', '2028-11-22'), null);
  assert.equal(lireDateAdresse('?date=2029-01-01', '2026-11-22', '2028-11-22'), null);
  assert.equal(lireDateAdresse('?date=2026-11-22', '2026-11-22', '2028-11-22'), '2026-11-22');
});
