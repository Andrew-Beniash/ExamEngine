import { QuickSQLiteConnection } from 'react-native-quick-sqlite';
import { Tip } from '../../shared/types/database';

export interface TipSearchOptions {
  query?: string;
  topicIds?: string[];
  packIds?: string[];
  limit?: number;
  offset?: number;
}

interface DatabaseRow {
  id: string;
  topic_ids: string;
  title: string;
  body: string;
  pack_id: string;
  count?: number;
  created_at?: number;
  viewed_at?: number;
}

export interface TipRepository {
  getAllTips(): Promise<Tip[]>;
  getTipById(id: string): Promise<Tip | null>;
  searchTips(options: TipSearchOptions): Promise<Tip[]>;
  getTipsByTopicIds(topicIds: string[]): Promise<Tip[]>;
  getTipsByPackId(packId: string): Promise<Tip[]>;
  getBookmarkedTips(deviceGuid: string): Promise<Tip[]>;
  toggleBookmark(tipId: string, deviceGuid: string): Promise<boolean>;
  isBookmarked(tipId: string, deviceGuid: string): Promise<boolean>;
  getRecentlyViewedTips(deviceGuid: string, limit?: number): Promise<Tip[]>;
  markTipAsViewed(tipId: string, deviceGuid: string): Promise<void>;
  getTipsCount(): Promise<number>;
  getTopicsWithTipCounts(): Promise<{ topicId: string; count: number }[]>;
}

export class SQLiteTipRepository implements TipRepository {
  constructor(private db: QuickSQLiteConnection) {}

  async getAllTips(): Promise<Tip[]> {
    try {
      const result = this.db.execute(`
        SELECT id, topic_ids, title, body, pack_id
        FROM tip
        ORDER BY title ASC
      `);

      return result.rows?._array?.map(this.mapRowToTip) || [];
    } catch (error) {
      console.error('Error getting all tips:', error);
      return [];
    }
  }

  async getTipById(id: string): Promise<Tip | null> {
    try {
      const result = this.db.execute(
        `SELECT id, topic_ids, title, body, pack_id
         FROM tip 
         WHERE id = ?`,
        [id]
      );

      const row = result.rows?._array?.[0];
      return row ? this.mapRowToTip(row) : null;
    } catch (error) {
      console.error('Error getting tip by id:', error);
      return null;
    }
  }

  async searchTips(options: TipSearchOptions): Promise<Tip[]> {
    try {
      const { query, topicIds, packIds, limit = 50, offset = 0 } = options;
      
      let sql = `
        SELECT DISTINCT t.id, t.topic_ids, t.title, t.body, t.pack_id
        FROM tip t
        WHERE 1=1
      `;
      const params: any[] = [];

      // Full-text search across title and body
      if (query && query.trim()) {
        sql += ` AND (
          t.title LIKE ? OR 
          t.body LIKE ?
        )`;
        const searchTerm = `%${query.trim()}%`;
        params.push(searchTerm, searchTerm);
      }

      // Filter by topic IDs
      if (topicIds && topicIds.length > 0) {
        const topicConditions = topicIds.map(() => 't.topic_ids LIKE ?').join(' OR ');
        sql += ` AND (${topicConditions})`;
        topicIds.forEach(topicId => params.push(`%"${topicId}"%`));
      }

      // Filter by pack IDs
      if (packIds && packIds.length > 0) {
        const placeholders = packIds.map(() => '?').join(',');
        sql += ` AND t.pack_id IN (${placeholders})`;
        params.push(...packIds);
      }

      sql += ` ORDER BY 
        CASE 
          WHEN t.title LIKE ? THEN 1 
          ELSE 2 
        END, 
        t.title ASC
        LIMIT ? OFFSET ?
      `;
      
      // Add title match priority parameter
      params.push(query ? `%${query.trim()}%` : '%', limit, offset);

      const result = this.db.execute(sql, params);
      return result.rows?._array?.map(this.mapRowToTip) || [];
    } catch (error) {
      console.error('Error searching tips:', error);
      return [];
    }
  }

  async getTipsByTopicIds(topicIds: string[]): Promise<Tip[]> {
    if (topicIds.length === 0) return [];

    try {
      const conditions = topicIds.map(() => 'topic_ids LIKE ?').join(' OR ');
      const params = topicIds.map(topicId => `%"${topicId}"%`);

      const result = this.db.execute(
        `SELECT id, topic_ids, title, body, pack_id
         FROM tip 
         WHERE ${conditions}
         ORDER BY title ASC`,
        params
      );

      return result.rows?._array?.map(this.mapRowToTip) || [];
    } catch (error) {
      console.error('Error getting tips by topic IDs:', error);
      return [];
    }
  }

  async getTipsByPackId(packId: string): Promise<Tip[]> {
    try {
      const result = this.db.execute(
        `SELECT id, topic_ids, title, body, pack_id
         FROM tip 
         WHERE pack_id = ?
         ORDER BY title ASC`,
        [packId]
      );

      return result.rows?._array?.map(this.mapRowToTip) || [];
    } catch (error) {
      console.error('Error getting tips by pack ID:', error);
      return [];
    }
  }

  async getBookmarkedTips(deviceGuid: string): Promise<Tip[]> {
    try {
      const result = this.db.execute(`
        SELECT t.id, t.topic_ids, t.title, t.body, t.pack_id
        FROM tip t
        INNER JOIN tip_bookmark tb ON t.id = tb.tip_id
        WHERE tb.device_guid = ?
        ORDER BY tb.created_at DESC
      `, [deviceGuid]);

      return result.rows?._array?.map(this.mapRowToTip) || [];
    } catch (error) {
      console.error('Error getting bookmarked tips:', error);
      return [];
    }
  }

  async toggleBookmark(tipId: string, deviceGuid: string): Promise<boolean> {
    try {
      const isCurrentlyBookmarked = await this.isBookmarked(tipId, deviceGuid);

      if (isCurrentlyBookmarked) {
        // Remove bookmark
        this.db.execute(
          `DELETE FROM tip_bookmark 
           WHERE tip_id = ? AND device_guid = ?`,
          [tipId, deviceGuid]
        );
        return false;
      } else {
        // Add bookmark
        this.db.execute(
          `INSERT OR REPLACE INTO tip_bookmark (tip_id, device_guid, created_at)
           VALUES (?, ?, ?)`,
          [tipId, deviceGuid, Date.now()]
        );
        return true;
      }
    } catch (error) {
      console.error('Error toggling tip bookmark:', error);
      return false;
    }
  }

  async isBookmarked(tipId: string, deviceGuid: string): Promise<boolean> {
    try {
      const result = this.db.execute(
        `SELECT 1 FROM tip_bookmark 
         WHERE tip_id = ? AND device_guid = ?`,
        [tipId, deviceGuid]
      );

      return (result.rows?._array?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking tip bookmark:', error);
      return false;
    }
  }

  async getRecentlyViewedTips(deviceGuid: string, limit = 10): Promise<Tip[]> {
    try {
      const result = this.db.execute(`
        SELECT t.id, t.topic_ids, t.title, t.body, t.pack_id
        FROM tip t
        INNER JOIN tip_view_history tvh ON t.id = tvh.tip_id
        WHERE tvh.device_guid = ?
        ORDER BY tvh.viewed_at DESC
        LIMIT ?
      `, [deviceGuid, limit]);

      return result.rows?._array?.map(this.mapRowToTip) || [];
    } catch (error) {
      console.error('Error getting recently viewed tips:', error);
      return [];
    }
  }

  async markTipAsViewed(tipId: string, deviceGuid: string): Promise<void> {
    try {
      this.db.execute(
        `INSERT OR REPLACE INTO tip_view_history (tip_id, device_guid, viewed_at)
         VALUES (?, ?, ?)`,
        [tipId, deviceGuid, Date.now()]
      );
    } catch (error) {
      console.error('Error marking tip as viewed:', error);
    }
  }

  async getTipsCount(): Promise<number> {
    try {
      const result = this.db.execute('SELECT COUNT(*) as count FROM tip');
      return result.rows?._array?.[0]?.count || 0;
    } catch (error) {
      console.error('Error getting tips count:', error);
      return 0;
    }
  }

  async getTopicsWithTipCounts(): Promise<{ topicId: string; count: number }[]> {
    try {
      // This is a simplified version - in practice you'd parse JSON topic_ids
      const result = this.db.execute(`
        SELECT topic_ids, COUNT(*) as count
        FROM tip
        GROUP BY topic_ids
      `);

      // Parse JSON topic IDs and aggregate counts
      const topicCounts: Record<string, number> = {};
      
      result.rows?._array?.forEach(row => {
        try {
          const topicIds: string[] = JSON.parse(row.topic_ids);
          topicIds.forEach(topicId => {
            topicCounts[topicId] = (topicCounts[topicId] || 0) + row.count;
          });
        } catch (e) {
          console.warn('Failed to parse topic_ids:', row.topic_ids);
        }
      });

      return Object.entries(topicCounts).map(([topicId, count]) => ({
        topicId,
        count,
      }));
    } catch (error) {
      console.error('Error getting topics with tip counts:', error);
      return [];
    }
  }

  private mapRowToTip(row: DatabaseRow): Tip {
    return {
      id: row.id,
      topicIds: JSON.parse(row.topic_ids || '[]'),
      title: row.title,
      body: row.body,
      packId: row.pack_id,
    };
  }
}

// Schema addition for tip bookmarks and view history
export const tipBookmarkSchema = `
  CREATE TABLE IF NOT EXISTS tip_bookmark (
    tip_id TEXT NOT NULL,
    device_guid TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (tip_id, device_guid),
    FOREIGN KEY (tip_id) REFERENCES tip(id)
  );

  CREATE INDEX IF NOT EXISTS idx_tip_bookmark_device ON tip_bookmark(device_guid);
  CREATE INDEX IF NOT EXISTS idx_tip_bookmark_created ON tip_bookmark(created_at);
`;

export const tipViewHistorySchema = `
  CREATE TABLE IF NOT EXISTS tip_view_history (
    tip_id TEXT NOT NULL,
    device_guid TEXT NOT NULL,
    viewed_at INTEGER NOT NULL,
    PRIMARY KEY (tip_id, device_guid),
    FOREIGN KEY (tip_id) REFERENCES tip(id)
  );

  CREATE INDEX IF NOT EXISTS idx_tip_view_device ON tip_view_history(device_guid);
  CREATE INDEX IF NOT EXISTS idx_tip_view_viewed_at ON tip_view_history(viewed_at);
`;