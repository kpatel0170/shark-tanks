import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function HEAD() {
  return NextResponse.json({ message: 'Socket endpoint active' })
}
