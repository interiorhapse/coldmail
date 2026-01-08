import '@/styles/globals.css';
import Layout from '@/components/layout/Layout';
import { ToastProvider } from '@/components/ui/Toast';

export default function App({ Component, pageProps }) {
  return (
    <ToastProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ToastProvider>
  );
}
