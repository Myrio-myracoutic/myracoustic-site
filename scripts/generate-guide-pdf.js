/* Génère public/guides/7-questions-dj-mariage.pdf à partir du contenu de
   app/guide-dj-mariage/guide-data.mjs — à relancer manuellement (`node
   scripts/generate-guide-pdf.js`) si Myrio veut mettre à jour le guide.
   Pas exécuté en prod : @react-pdf/renderer et les polices @fontsource sont
   en devDependencies, jamais dans le bundle déployé. */
const path = require('path');
const fs = require('fs');
const React = require('react');
const { Document, Page, View, Text, Image, Font, StyleSheet, renderToFile } = require('@react-pdf/renderer');

const e = React.createElement;

/* Contourne un bug de rendu des ligatures "fi"/"ff"/"fl" avec ces polices
   (glyphe ligaturé qui ne s'affiche pas dans le PDF final, ex. "officiant" →
   "ofciant") : on insère un joignant de largeur nulle entre "f" et la lettre
   suivante pour empêcher la formation de la ligature, sans rien changer au
   texte affiché sur la page web ou dans l'email (uniquement utilisé ici). */
function t(str) {
  return str.replace(/f(?=[fil])/g, 'f‌');
}

const FONT_DIR = path.join(__dirname, '../node_modules/@fontsource');
Font.register({
  family: 'Space Grotesk',
  fonts: [
    { src: path.join(FONT_DIR, 'space-grotesk/files/space-grotesk-latin-500-normal.woff'), fontWeight: 500 },
    { src: path.join(FONT_DIR, 'space-grotesk/files/space-grotesk-latin-700-normal.woff'), fontWeight: 700 },
  ],
});
Font.register({
  family: 'Hanken Grotesk',
  fonts: [
    { src: path.join(FONT_DIR, 'hanken-grotesk/files/hanken-grotesk-latin-400-normal.woff'), fontWeight: 400 },
    { src: path.join(FONT_DIR, 'hanken-grotesk/files/hanken-grotesk-latin-600-normal.woff'), fontWeight: 600 },
  ],
});

const NAVY = '#0d1b2a';
const LIME = '#b8ef0b';
const GREY = '#5b6472';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    color: NAVY,
    fontFamily: 'Hanken Grotesk',
    padding: '56 52 64',
  },
  coverPage: {
    backgroundColor: '#ffffff',
    color: NAVY,
    fontFamily: 'Hanken Grotesk',
    padding: '80 56',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 220, marginBottom: 40 },
  coverEyebrow: {
    fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10, letterSpacing: 2,
    color: GREY, textTransform: 'uppercase', marginBottom: 14,
  },
  coverTitle: {
    fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 30, lineHeight: 1.25,
    textAlign: 'center', marginBottom: 18,
  },
  coverSubtitle: {
    fontSize: 12.5, lineHeight: 1.6, textAlign: 'center', color: GREY, maxWidth: 340,
  },
  coverRule: { width: 64, height: 3, backgroundColor: LIME, marginTop: 34, marginBottom: 34 },
  coverFooter: { position: 'absolute', bottom: 44, fontSize: 9, color: GREY, textAlign: 'center' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 30, paddingBottom: 14, borderBottom: `1 solid #e7e5e0`,
  },
  headerLogo: { width: 90 },
  headerLabel: {
    fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 9, letterSpacing: 1.5,
    color: GREY, textTransform: 'uppercase',
  },

  question: { marginBottom: 26 },
  qHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  qBadge: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: LIME,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  qBadgeText: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: NAVY },
  qTitle: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14.5, flex: 1 },
  qLabel: {
    fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 8.5, letterSpacing: 1,
    color: GREY, textTransform: 'uppercase', marginBottom: 3,
  },
  qWhy: { fontSize: 10.5, lineHeight: 1.6, color: '#33404f', marginBottom: 10, marginLeft: 38 },
  qAnswerBox: {
    marginLeft: 38, backgroundColor: '#f6f9e8', borderLeft: `2 solid ${LIME}`,
    padding: '10 14',
  },
  qAnswer: { fontSize: 10.5, lineHeight: 1.6, color: NAVY },

  credBox: {
    marginTop: 8, padding: '16 18', backgroundColor: NAVY, borderRadius: 8,
  },
  credText: { fontSize: 10, lineHeight: 1.65, color: '#e8ecef' },

  pageFooter: {
    position: 'absolute', bottom: 28, left: 52, right: 52,
    flexDirection: 'row', justifyContent: 'space-between',
    fontSize: 8, color: '#9aa2ab',
  },
});

function Cover({ title, subtitle }) {
  return e(Page, { size: 'A4', style: styles.coverPage },
    e(Image, { src: path.join(__dirname, '../public/logo-light.png'), style: styles.logo }),
    e(Text, { style: styles.coverEyebrow }, t('Guide gratuit Myracoustic')),
    e(Text, { style: styles.coverTitle }, t(title)),
    e(View, { style: styles.coverRule }),
    e(Text, { style: styles.coverSubtitle }, t(subtitle)),
    e(Text, { style: styles.coverFooter }, t('myracoustic.com — Son, Lumière, Vidéo & DJ pour mariages en Pays de la Loire')),
  );
}

function ContentPage({ questions, credibility }) {
  return e(Page, { size: 'A4', style: styles.page },
    e(View, { style: styles.header, fixed: true },
      e(Image, { src: path.join(__dirname, '../public/logo-light.png'), style: styles.headerLogo }),
      e(Text, { style: styles.headerLabel }, t('7 questions avant de choisir son DJ de mariage')),
    ),
    ...questions.map(q => e(View, { key: q.n, style: styles.question, wrap: false },
      e(View, { style: styles.qHead },
        e(View, { style: styles.qBadge }, e(Text, { style: styles.qBadgeText }, String(q.n))),
        e(Text, { style: styles.qTitle }, t(q.title)),
      ),
      e(Text, { style: styles.qLabel }, 'Pourquoi ça compte'),
      e(Text, { style: styles.qWhy }, t(q.why)),
      e(View, { style: styles.qAnswerBox },
        e(Text, { style: styles.qLabel }, 'Une bonne réponse'),
        e(Text, { style: styles.qAnswer }, t(q.goodAnswer)),
      ),
    )),
    e(View, { style: styles.credBox },
      e(Text, { style: styles.credText }, t(credibility)),
    ),
    e(View, { style: styles.pageFooter, fixed: true },
      e(Text, {}, 'Myracoustic — 07 68 53 33 08 — contact@myracoustic.com'),
      e(Text, { render: ({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}` }),
    ),
  );
}

async function main() {
  const { GUIDE_TITLE, GUIDE_SUBTITLE, GUIDE_QUESTIONS, GUIDE_CREDIBILITY } =
    await import('../app/guide-dj-mariage/guide-data.mjs');

  const doc = e(Document, { title: GUIDE_TITLE, author: 'Myracoustic' },
    Cover({ title: GUIDE_TITLE, subtitle: GUIDE_SUBTITLE }),
    ContentPage({ questions: GUIDE_QUESTIONS, credibility: GUIDE_CREDIBILITY }),
  );

  const outDir = path.join(__dirname, '../public/guides');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, '7-questions-dj-mariage.pdf');
  await renderToFile(doc, outPath);
  console.log(`PDF généré : ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
