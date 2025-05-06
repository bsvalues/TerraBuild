import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { IStorage } from './storage';
import { User, InsertUser, CostMatrix, InsertCostMatrix, Session, InsertSession, SessionHistory, InsertSessionHistory, Insight, InsertInsight } from '../shared/schema';

let db: Database;

async function initDatabase() {
  db = await open({
    filename: './terrabuild.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      fullName TEXT,
      role TEXT,
      county TEXT,
      department TEXT,
      email TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId INTEGER,
      matrixName TEXT,
      status TEXT,
      settings TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS session_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT,
      event TEXT,
      data TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sessionId) REFERENCES sessions(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT,
      agentId TEXT,
      agentName TEXT,
      message TEXT,
      metadata TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sessionId) REFERENCES sessions(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS matrix_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT,
      itemId INTEGER,
      buildingType TEXT,
      baseCost REAL,
      description TEXT,
      adjustedCost REAL,
      changePercent REAL,
      metadata TEXT,
      FOREIGN KEY (sessionId) REFERENCES sessions(id)
    )
  `);

  return db;
}

export class SQLiteStorage implements IStorage {
  constructor() {
    this.init();
  }

  private async init() {
    await initDatabase();
    console.log('SQLite database initialized');
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await db.run(
      'INSERT INTO users (username, fullName, role, county, department, email) VALUES (?, ?, ?, ?, ?, ?)',
      [userData.username, userData.fullName, userData.role, userData.county, userData.department, userData.email]
    );
    
    return {
      id: result.lastID as number,
      username: userData.username,
      fullName: userData.fullName,
      role: userData.role,
      county: userData.county,
      department: userData.department,
      email: userData.email,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getUser(id: number): Promise<User | null> {
    const user = await db.get('SELECT * FROM users WHERE id = ?', id);
    return user || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    return user || null;
  }

  async createSession(sessionData: InsertSession): Promise<Session> {
    await db.run(
      'INSERT INTO sessions (id, userId, matrixName, status, settings) VALUES (?, ?, ?, ?, ?)',
      [sessionData.id, sessionData.userId, sessionData.matrixName, sessionData.status, JSON.stringify(sessionData.settings)]
    );
    
    return {
      id: sessionData.id,
      userId: sessionData.userId,
      matrixName: sessionData.matrixName,
      status: sessionData.status,
      settings: sessionData.settings,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getSession(id: string): Promise<Session | null> {
    const session = await db.get('SELECT * FROM sessions WHERE id = ?', id);
    if (!session) return null;
    
    return {
      ...session,
      settings: JSON.parse(session.settings || '{}')
    };
  }

  async updateSession(id: string, data: Partial<Session>): Promise<Session | null> {
    const fields = Object.keys(data).filter(key => key !== 'id');
    if (fields.length === 0) return null;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      if (field === 'settings') return JSON.stringify(data[field]);
      return data[field];
    });

    await db.run(
      `UPDATE sessions SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );

    return this.getSession(id);
  }

  async createSessionHistory(historyData: InsertSessionHistory): Promise<SessionHistory> {
    const result = await db.run(
      'INSERT INTO session_history (sessionId, event, data) VALUES (?, ?, ?)',
      [historyData.sessionId, historyData.event, JSON.stringify(historyData.data)]
    );
    
    return {
      id: result.lastID as number,
      sessionId: historyData.sessionId,
      event: historyData.event,
      data: historyData.data,
      createdAt: new Date()
    };
  }

  async getSessionHistory(sessionId: string): Promise<SessionHistory[]> {
    const history = await db.all('SELECT * FROM session_history WHERE sessionId = ? ORDER BY createdAt', sessionId);
    return history.map(item => ({
      ...item,
      data: JSON.parse(item.data || '{}')
    }));
  }

  async createInsight(insightData: InsertInsight): Promise<Insight> {
    const result = await db.run(
      'INSERT INTO insights (sessionId, agentId, agentName, message, metadata) VALUES (?, ?, ?, ?, ?)',
      [insightData.sessionId, insightData.agentId, insightData.agentName, insightData.message, JSON.stringify(insightData.metadata)]
    );
    
    return {
      id: result.lastID as number,
      sessionId: insightData.sessionId,
      agentId: insightData.agentId,
      agentName: insightData.agentName,
      message: insightData.message,
      metadata: insightData.metadata,
      createdAt: new Date()
    };
  }

  async getInsights(sessionId: string): Promise<Insight[]> {
    const insights = await db.all('SELECT * FROM insights WHERE sessionId = ? ORDER BY createdAt DESC', sessionId);
    return insights.map(item => ({
      ...item,
      metadata: JSON.parse(item.metadata || '{}')
    }));
  }

  async saveMatrixItem(sessionId: string, item: any): Promise<any> {
    const result = await db.run(
      'INSERT INTO matrix_items (sessionId, itemId, buildingType, baseCost, description, adjustedCost, changePercent, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [sessionId, item.id, item.building_type, item.base_cost, item.description, item.adjustedCost || item.base_cost, item.changePercent || 0, JSON.stringify(item.metadata || {})]
    );
    
    return {
      id: result.lastID,
      sessionId,
      ...item
    };
  }

  async getMatrixItems(sessionId: string): Promise<any[]> {
    const items = await db.all('SELECT * FROM matrix_items WHERE sessionId = ?', sessionId);
    return items.map(item => ({
      ...item,
      metadata: JSON.parse(item.metadata || '{}')
    }));
  }

  async updateMatrixItem(sessionId: string, itemId: number, updates: any): Promise<any> {
    const fields = Object.keys(updates).filter(key => !['id', 'sessionId', 'itemId'].includes(key));
    if (fields.length === 0) return null;

    const setClause = fields.map(field => {
      if (field === 'metadata') return `${field} = ?`;
      return `${field} = ?`;
    }).join(', ');
    
    const values = fields.map(field => {
      if (field === 'metadata') return JSON.stringify(updates[field] || {});
      return updates[field];
    });

    await db.run(
      `UPDATE matrix_items SET ${setClause} WHERE sessionId = ? AND itemId = ?`,
      [...values, sessionId, itemId]
    );

    const updated = await db.get('SELECT * FROM matrix_items WHERE sessionId = ? AND itemId = ?', [sessionId, itemId]);
    if (!updated) return null;
    
    return {
      ...updated,
      metadata: JSON.parse(updated.metadata || '{}')
    };
  }

  // Implement other required methods for IStorage
  // These can be stubbed for now and implemented as needed
  async getUsers(): Promise<User[]> {
    return [];
  }
  
  async getUserById(): Promise<User | null> {
    return null;
  }
  
  async getUserByEmail(): Promise<User | null> {
    return null;
  }
  
  async deleteUser(): Promise<boolean> {
    return false;
  }
  
  async updateUser(): Promise<User | null> {
    return null;
  }
  
  // ... other required methods with stub implementations
}