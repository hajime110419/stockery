import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import Database from 'better-sqlite3'

// 文房具の型定義 (Goのstructに相当)
interface Stationery {
  id: string;
  category: string;
  name: string;
  location: string;
  in_use: boolean;
  created_at?: string;
  updated_at?: string;
}

const app = new Hono()

// --- データベース準備 ---
const db = new Database('stockery.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS stationeries (
    id TEXT PRIMARY KEY,
    category TEXT,
    name TEXT,
    location TEXT,
    in_use INTEGER, -- SQLiteはBooleanの代わりに0/1
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

// --- ルーティング ---

// 1. トップページ
app.get('/', (c) => c.text('Stockery API is running!'))

// 2. 一覧取得
app.get('/items', (c) => {
  const stmt = db.prepare('SELECT * FROM stationeries')
  const items = stmt.all() as Stationery[]
  return c.json(items)
})

// 3. アイテム追加
app.post('/items', async (c) => {
  const body = await c.req.json<Stationery>()
  
  const stmt = db.prepare(`
    INSERT INTO stationeries (id, category, name, location, in_use)
    VALUES (@id, @category, @name, @location, @in_use)
  `)

  // Object形式でパラメータを渡せるのが better-sqlite3 の楽なところ
  stmt.run({
    id: body.id,
    category: body.category,
    name: body.name,
    location: body.location,
    in_use: body.in_use ? 1 : 0
  })

  return c.json({ message: 'Success!' }, 201)
})

// --- サーバー起動 ---
console.log('Server started: http://localhost:8080')
serve({ fetch: app.fetch, port: 8080 })