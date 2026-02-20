import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-950 via-blue-900 to-slate-950 p-8 text-white">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 pt-24 text-center">
        <h1 className="text-5xl font-black">Shark Tanks</h1>
        <p>Multiplayer 3D tank combat migrated to Next.js 16 + Socket.io + React Three Fiber.</p>
        <Link className="rounded-md bg-emerald-500 px-6 py-3 font-semibold hover:bg-emerald-600" href="/lobby">
          Enter Lobby
        </Link>
      </div>
    </main>
  )
}
