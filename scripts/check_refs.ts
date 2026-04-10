import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const postgresUrl = process.env.POSTGRES_URL

console.log('Supabase URL:', supabaseUrl)
// Extract ref from URL like https://[ref].supabase.co
const sbRef = supabaseUrl?.match(/https:\/\/(.*)\.supabase\.co/)?.[1]

// Extract ref from postgres like postgres://postgres.[ref]:...
const pgRef = postgresUrl?.match(/postgres\.(.*):/)?.[1]

console.log('Supabase Ref:', sbRef)
console.log('Postgres Ref:', pgRef)

if (sbRef && pgRef && sbRef !== pgRef) {
    console.error('CRITICAL: Mismatch between Supabase URL and Postgres URL!')
} else {
    console.log('Refs match.')
}
