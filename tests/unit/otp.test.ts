import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, PUT } from '@/app/api/auth/verify-phone/route';

// Mock Supabase
const mockGetUser = vi.fn();
const mockUpdateUserById = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createRouteHandlerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      admin: {
        updateUserById: mockUpdateUserById,
      },
    },
    from: mockFrom,
  })),
}));

describe('OTP Verification API Route (verify-phone)', () => {
  const mockUser = { id: 'test-user-id', email: 'tester@example.com', user_metadata: {} };
  const mockPhone = '09171234567';

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear global cache if populated
    const cache = (globalThis as any).otpCache;
    if (cache) {
      cache.clear();
    }
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
  });

  describe('POST /api/auth/verify-phone', () => {
    it('should generate a cryptographically secure 4-digit code and initialize attempts to 0', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/verify-phone', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: mockPhone }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);

      const cache = (globalThis as any).otpCache;
      expect(cache).toBeDefined();
      const cachedEntry = cache.get(mockUser.id);
      expect(cachedEntry).toBeDefined();
      expect(cachedEntry.phoneNumber).toBe(mockPhone);
      expect(cachedEntry.attempts).toBe(0);
      expect(cachedEntry.code).toMatch(/^\d{4}$/);
      
      const numericCode = parseInt(cachedEntry.code, 10);
      expect(numericCode).toBeGreaterThanOrEqual(1000);
      expect(numericCode).toBeLessThan(10000);
    });
  });

  describe('PUT /api/auth/verify-phone', () => {
    beforeEach(async () => {
      // Seed OTP cache before each PUT test
      const req = new NextRequest('http://localhost:3000/api/auth/verify-phone', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: mockPhone }),
      });
      await POST(req);
    });

    it('should verify successfully with the correct OTP code', async () => {
      const cache = (globalThis as any).otpCache;
      const cachedEntry = cache.get(mockUser.id);
      expect(cachedEntry).toBeDefined();
      const correctCode = cachedEntry.code;

      mockUpdateUserById.mockResolvedValue({ data: { user: {} }, error: null });
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/auth/verify-phone', {
        method: 'PUT',
        body: JSON.stringify({ code: correctCode }),
      });

      const res = await PUT(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(cache.has(mockUser.id)).toBe(false); // Cache should be cleared
    });

    it('should increment attempts and show remaining attempts on incorrect code', async () => {
      const cache = (globalThis as any).otpCache;
      const cachedEntry = cache.get(mockUser.id);
      const wrongCode = cachedEntry.code === '1111' ? '2222' : '1111';

      // 1st wrong attempt
      const req1 = new NextRequest('http://localhost:3000/api/auth/verify-phone', {
        method: 'PUT',
        body: JSON.stringify({ code: wrongCode }),
      });
      const res1 = await PUT(req1);
      const json1 = await res1.json();

      expect(res1.status).toBe(400);
      expect(json1.error).toContain('2 attempt(s) remaining');
      expect(cachedEntry.attempts).toBe(1);

      // 2nd wrong attempt
      const req2 = new NextRequest('http://localhost:3000/api/auth/verify-phone', {
        method: 'PUT',
        body: JSON.stringify({ code: wrongCode }),
      });
      const res2 = await PUT(req2);
      const json2 = await res2.json();

      expect(res2.status).toBe(400);
      expect(json2.error).toContain('1 attempt(s) remaining');
      expect(cachedEntry.attempts).toBe(2);

      // 3rd wrong attempt - should delete the entry and show failure
      const req3 = new NextRequest('http://localhost:3000/api/auth/verify-phone', {
        method: 'PUT',
        body: JSON.stringify({ code: wrongCode }),
      });
      const res3 = await PUT(req3);
      const json3 = await res3.json();

      expect(res3.status).toBe(400);
      expect(json3.error).toContain('Verification failed due to too many invalid attempts');
      expect(cache.has(mockUser.id)).toBe(false); // Deleted from cache
    });
  });
});
