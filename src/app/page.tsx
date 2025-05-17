import Head from 'next/head';
import TokenFaucet from '../components/TokenFaucet';

export default function Home() {
  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center justify-center">
      <Head>
        <title>LendBit Testnet Faucet</title>
        <meta name="description" content="Get testnet tokens for LendBit" />
        <link rel="icon" href="/icon.svg" />
      </Head>

      <main className="w-full">
        <TokenFaucet />
      </main>

      <footer className="mt-12 text-center">
        <p className="text-sm text-gray-500">© 2025 LendBit. All rights reserved.</p>
      </footer>
    </div>
  );
}
