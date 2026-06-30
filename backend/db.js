import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_URL || join(__dirname, 'database.sqlite');
const jsonDbPath = join(__dirname, 'database.json');

let sqlite3 = null;
let sqliteDb = null;
let useSqlite = false;


try {
  
  
  const sqliteModule = await import('sqlite3');
  sqlite3 = sqliteModule.default;
  
  
  const dbDir = dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.warn('SQLite failed to open, falling back to JSON database:', err.message);
    } else {
      console.log('Using SQLite Database at:', dbPath);
      useSqlite = true;
      initializeSqliteSchema();
    }
  });
} catch (err) {
  console.log('Sqlite3 not found or failed to compile. Using lightweight JSON database at:', jsonDbPath);
  initializeJsonSchema();
}




function initializeSqliteSchema() {
  sqliteDb.serialize(() => {
    sqliteDb.run('PRAGMA foreign_keys = ON;');
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        sender TEXT CHECK(sender IN ('user', 'assistant')) NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      )
    `);
  });
}




function initializeJsonSchema() {
  if (!fs.existsSync(jsonDbPath)) {
    fs.writeFileSync(jsonDbPath, JSON.stringify({ chats: [], messages: [] }, null, 2));
  }
}

function readJsonDb() {
  try {
    return JSON.parse(fs.readFileSync(jsonDbPath, 'utf8'));
  } catch (err) {
    return { chats: [], messages: [] };
  }
}

function writeJsonDb(data) {
  try {
    fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing JSON database:', err);
  }
}





export const query = (sql, params = []) => {
  if (useSqlite) {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  } else {
    
    const db = readJsonDb();
    const sqlClean = sql.trim().replace(/\s+/g, ' ');

    if (sqlClean.includes('SELECT * FROM chats')) {
      
      return Promise.resolve(
        [...db.chats].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      );
    }

    if (sqlClean.includes('messages WHERE chat_id = ?')) {
      const chatId = params[0];
      const filtered = db.messages.filter(m => m.chat_id === chatId);
      const sorted = filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return Promise.resolve(sorted);
    }

    return Promise.resolve([]);
  }
};

export const run = (sql, params = []) => {
  if (useSqlite) {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  } else {
    
    const db = readJsonDb();
    const sqlClean = sql.trim().replace(/\s+/g, ' ');

    if (sqlClean.includes('INSERT INTO chats')) {
      
      const [id, title] = params;
      db.chats.push({
        id,
        title,
        created_at: new Date().toISOString()
      });
      writeJsonDb(db);
      return Promise.resolve({ changes: 1 });
    }

    if (sqlClean.includes('DELETE FROM chats WHERE id = ?')) {
      const id = params[0];
      const initialCount = db.chats.length;
      db.chats = db.chats.filter(c => c.id !== id);
      db.messages = db.messages.filter(m => m.chat_id !== id);
      writeJsonDb(db);
      return Promise.resolve({ changes: initialCount - db.chats.length });
    }

    if (sqlClean.includes('INSERT INTO messages')) {
      
      const [id, chat_id, sender, content] = params;
      db.messages.push({
        id,
        chat_id,
        sender,
        content,
        created_at: new Date().toISOString()
      });
      writeJsonDb(db);
      return Promise.resolve({ changes: 1 });
    }

    if (sqlClean.includes('UPDATE chats SET title = ? WHERE id = ?')) {
      const [title, id] = params;
      let updated = false;
      db.chats = db.chats.map(c => {
        if (c.id === id) {
          updated = true;
          return { ...c, title };
        }
        return c;
      });
      writeJsonDb(db);
      return Promise.resolve({ changes: updated ? 1 : 0 });
    }

    if (sqlClean.includes('UPDATE messages SET content = ? WHERE id = ?')) {
      const [content, id] = params;
      let updated = false;
      db.messages = db.messages.map(m => {
        if (m.id === id) {
          updated = true;
          return { ...m, content };
        }
        return m;
      });
      writeJsonDb(db);
      return Promise.resolve({ changes: updated ? 1 : 0 });
    }

    return Promise.resolve({ changes: 0 });
  }
};

export const get = (sql, params = []) => {
  if (useSqlite) {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  } else {
    
    const db = readJsonDb();
    const sqlClean = sql.trim().replace(/\s+/g, ' ');

    if (sqlClean.includes('SELECT title FROM chats WHERE id = ?')) {
      const id = params[0];
      const chat = db.chats.find(c => c.id === id);
      return Promise.resolve(chat ? { title: chat.title } : undefined);
    }

    if (sqlClean.includes('SELECT * FROM messages WHERE id = ? AND chat_id = ?')) {
      const [messageId, chatId] = params;
      const msg = db.messages.find(m => m.id === messageId && m.chat_id === chatId);
      return Promise.resolve(msg);
    }

    if (sqlClean.includes('SELECT * FROM chats WHERE id = ?')) {
      const id = params[0];
      const chat = db.chats.find(c => c.id === id);
      return Promise.resolve(chat);
    }

    return Promise.resolve(undefined);
  }
};

export default { sqliteDb, query, run, get };
