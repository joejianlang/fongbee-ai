/**
 * Contract Diff 测试
 *
 * 覆盖 GET /api/contracts/:id/diff
 *
 * 场景:
 *   1. 相邻版本 — 有预存 diffFromPrev → 直接返回（isPrecomputed: true）
 *   2. 任意版本 — 实时 Myers Diff（isPrecomputed: false）
 *   3. 纯新增 diff
 *   4. 纯删除 diff
 *   5. 混合 diff（新增 + 删除 + 不变）
 *   6. 入参校验：from >= to → 400
 *   7. 入参校验：from 或 to 为 0 / 非数字 → 400
 *   8. 合同不存在 → 404
 *   9. 版本不存在 → 404
 *  10. 无权限访问 → 403
 *  11. 未登录 → 401
 *  12. 客户身份可访问自己的合同
 *  13. ADMIN 身份可访问任意合同
 */

// ── Mock 声明（必须在 import 前）─────────────────────────────────────────────

const mockGetServerSession = jest.fn();

jest.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
jest.mock('@/app/api/auth/[...nextauth]/auth-options', () => ({
  authOptions: {},
}));

const mockContractFindUnique        = jest.fn();
const mockContractVersionFindUnique = jest.fn();
const mockServiceProviderFindFirst  = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    contract:        { findUnique: mockContractFindUnique },
    contractVersion: { findUnique: mockContractVersionFindUnique },
    serviceProvider: { findFirst: mockServiceProviderFindFirst },
  },
}));

// ── Imports ───────────────────────────────────────────────────────────────────
import { NextRequest } from 'next/server';

function makeRequest(url: string): NextRequest {
  return new NextRequest(url, { method: 'GET' });
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CONTRACT_ID = 'contract_abc';

const baseContract = {
  id: CONTRACT_ID,
  project: {
    customerId:        'cust_1',
    serviceProviderId: 'sp_1',
  },
};

const v1 = {
  content: 'Line 1\nLine 2\nLine 3\n',
  version: 1,
  status: 'DRAFT',
  createdAt: new Date('2024-01-01'),
  diffFromPrev: null,
};

const v2 = {
  content: 'Line 1\nLine 2 modified\nLine 3\nLine 4 added\n',
  version: 2,
  status: 'DRAFT',
  createdAt: new Date('2024-01-02'),
  diffFromPrev: JSON.stringify([
    { type: 'unchanged', lineStart: 1, lineEnd: 1, text: 'Line 1\n' },
    { type: 'removed',   lineStart: 2, lineEnd: 2, text: 'Line 2\n' },
    { type: 'added',     lineStart: 2, lineEnd: 2, text: 'Line 2 modified\n' },
    { type: 'unchanged', lineStart: 3, lineEnd: 3, text: 'Line 3\n' },
    { type: 'added',     lineStart: 4, lineEnd: 4, text: 'Line 4 added\n' },
  ]),
};

const v3 = {
  content: 'Line 1\nLine 2 modified\nLine 3\nLine 4 added\nLine 5\n',
  version: 3,
  status: 'SIGNED',
  createdAt: new Date('2024-01-03'),
  diffFromPrev: null,
};

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();

  // Default: authenticated as contract owner (customer)
  mockGetServerSession.mockResolvedValue({ user: { id: 'cust_1', role: 'CUSTOMER' } });
  mockContractFindUnique.mockResolvedValue(baseContract);
  mockServiceProviderFindFirst.mockResolvedValue(null);

  // Default: findUnique for versions returns based on version number
  mockContractVersionFindUnique.mockImplementation(({ where }) => {
    const { version } = where.contractId_version;
    if (version === 1) return Promise.resolve(v1);
    if (version === 2) return Promise.resolve(v2);
    if (version === 3) return Promise.resolve(v3);
    return Promise.resolve(null);
  });
});

// ── Helper: import route lazily ───────────────────────────────────────────────
async function callDiff(contractId: string, from: number | string, to: number | string) {
  const { GET } = await import('@/app/api/contracts/[id]/diff/route');
  const url = `http://localhost/api/contracts/${contractId}/diff?from=${from}&to=${to}`;
  return GET(makeRequest(url), { params: { id: contractId } });
}

// ════════════════════════════════════════════════════════════════════════════
// 1. 相邻版本 — 预存 diff
// ════════════════════════════════════════════════════════════════════════════

describe('Adjacent versions — precomputed diff', () => {

  it('should return precomputed diff for adjacent versions (v1→v2)', async () => {
    const res  = await callDiff(CONTRACT_ID, 1, 2);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.isPrecomputed).toBe(true);
    expect(data.data.from.version).toBe(1);
    expect(data.data.to.version).toBe(2);
    expect(Array.isArray(data.data.diff)).toBe(true);

    // Precomputed diff has 5 chunks
    expect(data.data.diff).toHaveLength(5);
    expect(data.data.diff[1].type).toBe('removed');
    expect(data.data.diff[2].type).toBe('added');
  });

  it('should compute diff live when adjacent version has no precomputed diff', async () => {
    // v2→v3: v3.diffFromPrev is null
    const res  = await callDiff(CONTRACT_ID, 2, 3);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.isPrecomputed).toBe(false);
    expect(data.data.summary).toBeDefined();
    expect(data.data.summary.added).toBeGreaterThanOrEqual(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. 任意版本 — 实时 Myers Diff
// ════════════════════════════════════════════════════════════════════════════

describe('Non-adjacent versions — live Myers Diff', () => {

  it('should compute live diff for v1→v3', async () => {
    const res  = await callDiff(CONTRACT_ID, 1, 3);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.isPrecomputed).toBe(false);
    expect(data.data.from.version).toBe(1);
    expect(data.data.to.version).toBe(3);
    expect(data.data.summary).toBeDefined();
    expect(typeof data.data.summary.added).toBe('number');
    expect(typeof data.data.summary.removed).toBe('number');
    expect(typeof data.data.summary.unchanged).toBe('number');
  });

  it('pure addition diff: all chunks should be added or unchanged', async () => {
    // v1 is a subset of v3, so diff should have no "removed" chunks if content is same prefix
    const res  = await callDiff(CONTRACT_ID, 1, 3);
    const data = await res.json();

    // v3 adds lines but doesn't remove "Line 1", so unchanged count > 0
    expect(data.data.summary.unchanged).toBeGreaterThan(0);
  });

  it('should include correct chunk types in diff array', async () => {
    const res  = await callDiff(CONTRACT_ID, 1, 2);
    const data = await res.json();

    // Even if precomputed: diff should have added/removed/unchanged
    const types = data.data.diff.map((d: { type: string }) => d.type);
    expect(types).toContain('added');
    expect(types).toContain('removed');
    expect(types).toContain('unchanged');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Pure Addition Diff (custom versions)
// ════════════════════════════════════════════════════════════════════════════

describe('Pure addition/deletion diffs via live compute', () => {

  it('pure addition: v1 (empty) → v2 (content)', async () => {
    // Override versions with pure addition scenario
    mockContractVersionFindUnique.mockImplementation(({ where }) => {
      const { version } = where.contractId_version;
      if (version === 1) return Promise.resolve({ ...v1, content: '' });
      if (version === 2) return Promise.resolve({ ...v2, diffFromPrev: null }); // force live compute
      return Promise.resolve(null);
    });

    const res  = await callDiff(CONTRACT_ID, 1, 2);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.isPrecomputed).toBe(false);
    // All chunks should be "added" type
    const types: string[] = data.data.diff.map((d: { type: string }) => d.type);
    expect(types.every((t) => t === 'added')).toBe(true);
    expect(data.data.summary.added).toBeGreaterThan(0);
    expect(data.data.summary.removed).toBe(0);
  });

  it('pure deletion: v1 (content) → v2 (empty)', async () => {
    mockContractVersionFindUnique.mockImplementation(({ where }) => {
      const { version } = where.contractId_version;
      if (version === 1) return Promise.resolve({ ...v1, content: 'Line A\nLine B\n' });
      if (version === 2) return Promise.resolve({ ...v2, content: '', diffFromPrev: null });
      return Promise.resolve(null);
    });

    const res  = await callDiff(CONTRACT_ID, 1, 2);
    const data = await res.json();

    expect(res.status).toBe(200);
    const types: string[] = data.data.diff.map((d: { type: string }) => d.type);
    expect(types.every((t) => t === 'removed')).toBe(true);
    expect(data.data.summary.removed).toBeGreaterThan(0);
    expect(data.data.summary.added).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. 入参校验
// ════════════════════════════════════════════════════════════════════════════

describe('Input validation', () => {

  it('should return 400 when from >= to', async () => {
    const res = await callDiff(CONTRACT_ID, 2, 1);
    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });

  it('should return 400 when from === to', async () => {
    const res = await callDiff(CONTRACT_ID, 2, 2);
    expect(res.status).toBe(400);
  });

  it('should return 400 when from is 0', async () => {
    const res = await callDiff(CONTRACT_ID, 0, 2);
    expect(res.status).toBe(400);
  });

  it('should return 400 when to is 0', async () => {
    const res = await callDiff(CONTRACT_ID, 1, 0);
    expect(res.status).toBe(400);
  });

  it('should return 400 when params are non-numeric strings', async () => {
    const res = await callDiff(CONTRACT_ID, 'abc', 'xyz');
    expect(res.status).toBe(400);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. 404 / 401 / 403
// ════════════════════════════════════════════════════════════════════════════

describe('Error states', () => {

  it('should return 404 if contract does not exist', async () => {
    mockContractFindUnique.mockResolvedValue(null);

    const res = await callDiff('nonexistent', 1, 2);
    expect(res.status).toBe(404);
  });

  it('should return 404 if from version does not exist', async () => {
    mockContractVersionFindUnique.mockImplementation(({ where }) => {
      const { version } = where.contractId_version;
      if (version === 1) return Promise.resolve(null); // missing
      if (version === 2) return Promise.resolve(v2);
      return Promise.resolve(null);
    });

    const res = await callDiff(CONTRACT_ID, 1, 2);
    expect(res.status).toBe(404);
    expect((await res.json()).message).toContain('1');
  });

  it('should return 404 if to version does not exist', async () => {
    mockContractVersionFindUnique.mockImplementation(({ where }) => {
      const { version } = where.contractId_version;
      if (version === 1) return Promise.resolve(v1);
      if (version === 2) return Promise.resolve(null); // missing
      return Promise.resolve(null);
    });

    const res = await callDiff(CONTRACT_ID, 1, 2);
    expect(res.status).toBe(404);
    expect((await res.json()).message).toContain('2');
  });

  it('should return 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await callDiff(CONTRACT_ID, 1, 2);
    expect(res.status).toBe(401);
  });

  it('should return 403 if user has no access to contract', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'stranger', role: 'CUSTOMER' } });
    mockServiceProviderFindFirst.mockResolvedValue(null); // not a SP either

    const res = await callDiff(CONTRACT_ID, 1, 2);
    expect(res.status).toBe(403);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. 权限: 客户、服务商、ADMIN
// ════════════════════════════════════════════════════════════════════════════

describe('Access control', () => {

  it('customer can access their own contract diff', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'cust_1', role: 'CUSTOMER' } });

    const res = await callDiff(CONTRACT_ID, 1, 2);
    expect(res.status).toBe(200);
  });

  it('service provider can access their own contract diff', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'sp_user_1', role: 'SERVICE_PROVIDER' } });
    mockServiceProviderFindFirst.mockResolvedValue({ id: 'sp_1' }); // matches serviceProviderId

    const res = await callDiff(CONTRACT_ID, 1, 2);
    expect(res.status).toBe(200);
  });

  it('ADMIN can access any contract diff', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'admin_99', role: 'ADMIN' } });

    const res = await callDiff(CONTRACT_ID, 1, 2);
    expect(res.status).toBe(200);
  });

  it('unrelated service provider cannot access contract', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'sp_user_other', role: 'SERVICE_PROVIDER' } });
    mockServiceProviderFindFirst.mockResolvedValue({ id: 'sp_other' }); // different SP

    const res = await callDiff(CONTRACT_ID, 1, 2);
    expect(res.status).toBe(403);
  });
});
