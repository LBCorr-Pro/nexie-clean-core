
import { useSearchParams } from 'next/navigation';

export function useGetSubInstanceId() {
  const searchParams = useSearchParams();
  // A maneira correta de obter um parâmetro é diretamente do hook
  const subInstanceId = searchParams.get('subInstanceId');
  return subInstanceId;
}
