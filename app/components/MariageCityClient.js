import MariageClient from '../mariage/MariageClient';

/* Pages « DJ mariage [ville] » (Nantes, Angers, Rennes, Saint-Nazaire). Depuis le 19/11, elles
   reprennent la présentation de /mariage (photos, application, parcours, avis) au lieu d'une mise
   en page à part. Ce qui reste propre à chaque ville est passé dans `city` (titre, introduction,
   distance, département, FAQ locale) : voir les page.js de chaque ville et app/mariage/MariageClient.js. */
export default function MariageCityClient({ city }) {
  return <MariageClient city={city} />;
}
