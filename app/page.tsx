import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";

export default function Home() {
  return (
    <div className="flex bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8 bg-white">
          <h1 className="text-3xl font-bold mb-4">
            Welcome to Amoria connekt Dashboard
          </h1>

        </main>
      </div>
    </div>
  );
}
