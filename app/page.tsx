'use client';

import { Layout } from '../src/components/Layout';
import { Home } from '../src/views/Home';

export default function HomePage() {
  return (
    <Layout showFooter={true}>
      <Home />
    </Layout>
  );
}