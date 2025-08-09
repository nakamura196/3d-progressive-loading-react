'use client';

import { Layout } from '../../src/components/Layout';
import { ViewerWrapper } from '../../src/components/ViewerWrapper';

export default function ViewerPage() {
  return (
    <Layout showFooter={false}>
      <ViewerWrapper />
    </Layout>
  );
}