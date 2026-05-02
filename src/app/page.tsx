import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#000d1a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-5xl font-black tracking-tight text-white uppercase">
          Shark<span className="text-[#00ff88]">Tanks</span>
        </h1>
        <p className="mt-3 text-sm tracking-widest text-slate-500 uppercase">
          3D Multiplayer · WebSocket Battle
        </p>
        <Link
          href="/lobby"
          className="mt-10 inline-block w-full h-12 leading-[3rem] rounded font-bold text-sm tracking-widest uppercase bg-[#00ff88] text-black hover:bg-[#00e87a] transition-colors"
        >
          Enter Lobby
        </Link>
      </div>
    </main>
  );
}
