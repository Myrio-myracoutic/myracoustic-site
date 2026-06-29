'use client';
import { useParams } from 'next/navigation';
import FormuleConfigPage from '../../../../components/FormuleConfigPage';

export default function Page() {
  const { formule } = useParams();
  return <FormuleConfigPage formuleKey={formule} />;
}
