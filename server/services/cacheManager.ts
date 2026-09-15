/**
 * ============================================================================
 * مدير الذاكرة التشغيلية المؤقتة (Afaq Global Active Server Cache Layer)
 * ============================================================================
 * يوفر استجابة فائقة السرعة للبيانات العامة (الإعدادات، الفقرات، الدول، الجامعات)
 * مع التحديث الفوري الفعال (Cache Invalidation & Auto-Refresh).
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
  source: string;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    invalidations: 0,
    startTime: new Date().toISOString(),
  };

  /**
   * جلب القيمة من الذاكرة إذا كانت صالحة ولم تنتهِ مدتها
   */
  get<T>(key: string): { data: T; isHit: true; timestamp: number } | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (entry.ttlMs > 0 && now - entry.timestamp > entry.ttlMs) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return { data: entry.data as T, isHit: true, timestamp: entry.timestamp };
  }

  /**
   * حفظ بيانات في الذاكرة التشغيلية
   */
  set<T>(key: string, data: T, ttlMs: number = 10 * 60 * 1000, source: string = 'postgres'): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
      source,
    });
  }

  /**
   * إبطال وتحديث مفتاح معين في الذاكرة
   */
  invalidate(key: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.stats.invalidations++;
    }
  }

  /**
   * إبطال مفاتيح تبدأ بـ prefix
   */
  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        this.stats.invalidations++;
      }
    }
  }

  /**
   * إبطال كل الذاكرة المؤقتة
   */
  clearAll(): void {
    this.cache.clear();
    this.stats.invalidations++;
  }

  /**
   * استخراج إحصائيات الذاكرة التشغيلية
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? ((this.stats.hits / totalRequests) * 100).toFixed(1) + '%' : '0%';
    
    return {
      activeKeysCount: this.cache.size,
      cachedKeys: Array.from(this.cache.keys()),
      hits: this.stats.hits,
      misses: this.stats.misses,
      invalidations: this.stats.invalidations,
      hitRate,
      uptimeStart: this.stats.startTime,
    };
  }

  /**
   * دالة مساعدة ذكية: تجلب من الذاكرة إن وجدت، أو تجلب من المصدر وتحدث الذاكرة فوراً
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number = 10 * 60 * 1000,
    sourceName: string = 'postgres'
  ): Promise<{ data: T; isCached: boolean; responseTimeMs: number }> {
    const start = Date.now();
    const cached = this.get<T>(key);

    if (cached) {
      return {
        data: cached.data,
        isCached: true,
        responseTimeMs: Date.now() - start,
      };
    }

    const freshData = await fetchFn();
    this.set(key, freshData, ttlMs, sourceName);

    return {
      data: freshData,
      isCached: false,
      responseTimeMs: Date.now() - start,
    };
  }
}

export const cacheManager = new CacheManager();
