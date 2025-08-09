'use client';

import { Layout } from '../src/components/Layout';
import { Home } from '../src/pages/Home';

export default function HomePage() {
  return (
    <Layout showFooter={false}>
      <Home />
    </Layout>
  );
}