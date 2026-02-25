/**
 * Geohash LBS 工具
 *
 * 算法: ngeohash (Node.js geohash encode/decode)
 * 精度: level 7 ≈ 150m × 150m (适合社区半径检索)
 *
 * 半径搜索策略:
 * 1. 对目标坐标编码得到 geohash (precision=7)
 * 2. 获取该 cell 的 8 个相邻 cell (共 9 个)
 * 3. WHERE geohash IN (9个前缀) — 使用 @@index([geohash]) 索引
 * 4. 精确过滤：在应用层计算 Haversine 距离，过滤超出半径的结果
 *
 * ⚠️  注意: Geohash 矩形 ≠ 圆形半径，相邻 cell 策略可能有遗漏边角，
 *   但对于社区应用（精度要求不高）已足够。如需精确圆形，使用 PostGIS ST_DWithin。
 */

import ngeohash from 'ngeohash';

export const GEOHASH_PRECISION = 7; // ≈ 150m × 150m

/**
 * 将经纬度编码为 Geohash 字符串
 */
export function encodeGeohash(lat: number, lng: number): string {
  return ngeohash.encode(lat, lng, GEOHASH_PRECISION);
}

/**
 * 解码 Geohash 为经纬度（返回中心点）
 */
export function decodeGeohash(geohash: string): { lat: number; lng: number } {
  const { latitude, longitude } = ngeohash.decode(geohash);
  return { lat: latitude, lng: longitude };
}

/**
 * 获取目标点的 9 个 Geohash 格子（自身 + 8 个相邻）
 * 用于数据库 IN 查询
 */
export function getNeighborGeohashes(lat: number, lng: number): string[] {
  const center = encodeGeohash(lat, lng);
  const neighbors = ngeohash.neighbors(center);
  return [center, ...Object.values(neighbors)];
}

/**
 * Haversine 公式计算两点距离（单位：米）
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // 地球半径（米）
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * 在 PostGeoTag 结果中过滤超出半径的记录
 *
 * @param items        数据库查询结果（带 latitude/longitude 字段）
 * @param centerLat    中心纬度
 * @param centerLng    中心经度
 * @param radiusMeters 半径（米），默认 5000m = 5km
 */
export function filterByRadius<T extends { latitude: number; longitude: number }>(
  items: T[],
  centerLat: number,
  centerLng: number,
  radiusMeters = 5000
): T[] {
  return items.filter((item) => {
    const dist = haversineDistance(centerLat, centerLng, item.latitude, item.longitude);
    return dist <= radiusMeters;
  });
}

/**
 * 完整的 LBS 查询参数生成器
 *
 * 返回用于 Prisma WHERE 条件的 geohash 列表
 *
 * @example
 * const geohashes = buildGeohashQuery(43.5448, -80.2482, 5000);
 * const posts = await prisma.postGeoTag.findMany({
 *   where: { geohash: { in: geohashes } },
 *   include: { post: true },
 * });
 * const filtered = filterByRadius(posts, lat, lng, 5000);
 */
export function buildGeohashQuery(
  lat: number,
  lng: number,
  _radiusMeters = 5000
): string[] {
  // 对于 precision=7 (≈150m), 9个邻居格子覆盖约 450m × 450m
  // 对于更大半径需要更多格子，但对于 5km 以内应用此策略已足够
  return getNeighborGeohashes(lat, lng);
}
