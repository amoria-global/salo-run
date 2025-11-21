import Sidebar from "./components/sidebar";

export default function Home() {
  return (
    <div className="flex bg-white">
      <Sidebar />
      <main className="flex-1 p-8 bg-white">
        <h1 className="text-3xl font-bold mb-4">
          Welcome to Amoria connekt Dashboard
        </h1>

      </main>
    </div>
  );
}
