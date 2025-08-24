import Uploader from "./components/Uploader";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Uploader />
    </main>
  );
}