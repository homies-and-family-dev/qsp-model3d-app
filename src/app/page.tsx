'use client';

import dynamic from 'next/dynamic';

const ModelCanvas = dynamic(() => import('@/components/ModelCanvas'), {
  ssr: false,
});

export default function Page() {
  return <ModelCanvas />;
}