import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3'

/**
 * Stationery item type definition
 * Represents a stationery item with its metadata
 */
interface Stationery {
  id: string;                    // Unique identifier (UUID)
  category: string;              // Category of the stationery item
  name: string;                  // Name of the stationery item
  location: string;              // Location where the item is stored
  in_use: boolean;               // Whether the item is currently in use
  created_at?: string;           // Timestamp when the item was created
  updated_at?: string;           // Timestamp when the item was last updated
}

// Initialize Hono application
const app = new Hono()

// ===== Database Setup =====
const db = new Database('stockery.db')

// Create stationeries table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS stationeries (
    id TEXT PRIMARY KEY,
    category TEXT,
    name TEXT,
    location TEXT,
    in_use INTEGER,                             -- 0 = not in use, 1 = in use (SQLite uses INTEGER for boolean)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

// ===== API Routes =====

/**
 * GET /
 * Returns a simple health check message
 */
app.get('/', (c) => c.text('Stockery API is running!/'))

/**
 * GET /items
 * Retrieves all stationery items from the database
 */
app.get('/items', (c) => {
  // Fetch all stationery items from the database
  const stmt = db.prepare('SELECT * FROM stationeries')
  const items = stmt.all() as Stationery[]
  return c.json(items)
})

/**
 * POST /items
 * Creates a new stationery item in the database
 * The ID is automatically generated as a UUID on the server side
 */
app.post('/items', async (c) => {
  // Extract request body, excluding the id field (will be generated server-side)
  const body = await c.req.json<Omit<Stationery, 'id'>>()
  
  // Generate a unique UUID for the new item
  const newId = uuidv4()

  // Prepare insert statement
  const stmt = db.prepare(`
    INSERT INTO stationeries (id, category, name, location, in_use)
    VALUES (@id, @category, @name, @location, @in_use)
  `)

  // Execute insert with generated ID and request data
  stmt.run({
    id: newId,
    category: body.category,
    name: body.name,
    location: body.location,
    in_use: body.in_use ? 1 : 0
  })

  // Return the created item with generated UUID and 201 Created status
  return c.json({ 
    message: 'Item created', 
    id: newId 
  }, 201)
})

// ===== Server Initialization =====
console.log('Server started: http://localhost:8080')

serve({ fetch: app.fetch, port: 8080 })