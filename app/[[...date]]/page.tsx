import Sanaharava from '@/components/Sanaharava';

export default function Home({ params }: { params: { date?: string[] } }) {
  // Extract date from optional catch-all route
  // If params.date exists and has an item, use it; otherwise use today
  const date = params.date?.[0];
  
  return (
    <main>
      <Sanaharava initialDate={date} />
    </main>
  );
}

