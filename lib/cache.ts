/**
 * Cache utility for storing data in localStorage with expiration
 */

const CACHE_PREFIX = "azure_devops_cache_";
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos em milissegundos

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Salva dados no cache do localStorage
 */
export function setCache<T>(key: string, data: T): void {
  try {
    const timestamp = Date.now();
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp,
      expiresAt: timestamp + CACHE_DURATION,
    };

    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error("Erro ao salvar cache:", error);
    // Silenciosamente falha se localStorage não estiver disponível
  }
}

/**
 * Recupera dados do cache se ainda válidos
 */
export function getCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);

    if (!cached) {
      return null;
    }

    const cacheEntry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();

    // Verifica se o cache expirou
    if (now > cacheEntry.expiresAt) {
      // Remove cache expirado
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return cacheEntry.data;
  } catch (error) {
    console.error("Erro ao recuperar cache:", error);
    return null;
  }
}

/**
 * Remove um item específico do cache
 */
export function removeCache(key: string): void {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.error("Erro ao remover cache:", error);
  }
}

/**
 * Limpa todo o cache relacionado ao Azure DevOps
 */
export function clearAllCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Erro ao limpar cache:", error);
  }
}

/**
 * Retorna informações sobre o cache (útil para debug)
 */
export function getCacheInfo(key: string): {
  exists: boolean;
  expiresIn?: number;
  age?: number;
} | null {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);

    if (!cached) {
      return { exists: false };
    }

    const cacheEntry: CacheEntry<unknown> = JSON.parse(cached);
    const now = Date.now();

    return {
      exists: true,
      expiresIn: Math.max(0, cacheEntry.expiresAt - now),
      age: now - cacheEntry.timestamp,
    };
  } catch (error) {
    console.error("Erro ao obter info do cache:", error);
    return null;
  }
}
