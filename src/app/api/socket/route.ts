export const runtime = 'nodejs'

export async function HEAD() {
  return new Response(null, { status: 204 })
}
