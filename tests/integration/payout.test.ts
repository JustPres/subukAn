import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payout/route';

// Mock Supabase module
const mockGetUser = vi.fn();
const mockGetUserById = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      admin: {
        getUserById: mockGetUserById,
      },
    },
    from: mockFrom,
  })),
}));

describe('Payout API Route Integration Tests (POST /api/payout)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
  });

  describe('Input Validation Handling', () => {
    it('should return 400 when body is invalid or missing submission_id', async () => {
      const req = new NextRequest('http://localhost:3000/api/payout', {
        method: 'POST',
        body: JSON.stringify({ amount: 100 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Invalid payload');
      expect(json.details).toBeDefined();
    });

    it('should return 400 when submission_id is not a valid UUID', async () => {
      const req = new NextRequest('http://localhost:3000/api/payout', {
        method: 'POST',
        body: JSON.stringify({ submission_id: 'invalid-id', amount: 100 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Invalid payload');
    });

    it('should return 400 when amount is not a positive integer', async () => {
      const req = new NextRequest('http://localhost:3000/api/payout', {
        method: 'POST',
        body: JSON.stringify({
          submission_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          amount: -50,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Invalid payload');
    });
  });

  describe('Authentication Handling', () => {
    it('should return 401 when Authorization token is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/payout', {
        method: 'POST',
        body: JSON.stringify({
          submission_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          amount: 100,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toContain('Session token is missing');
    });

    it('should return 401 when token is invalid or expired', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const req = new NextRequest('http://localhost:3000/api/payout', {
        method: 'POST',
        body: JSON.stringify({
          submission_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          amount: 100,
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token',
        },
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toContain('Invalid or expired session token');
    });
  });

  describe('Authorization & Payout Business Logic', () => {
    const validPosterId = 'poster-user-123';
    const validSubmissionId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const validListingId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    const validTesterId = 'tester-user-456';

    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: validPosterId, email: 'poster@example.com' } },
        error: null,
      });
      mockGetUserById.mockResolvedValue({
        data: { user: { phone: '09171234567' } },
        error: null,
      });
    });

    it('should return 404 if submission is not found', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'submissions') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: null, error: { message: 'Not found' } }),
              }),
            }),
          };
        }
        return {};
      });

      const req = new NextRequest('http://localhost:3000/api/payout', {
        method: 'POST',
        body: JSON.stringify({ submission_id: validSubmissionId, amount: 100 }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe('Submission not found');
    });

    it('should return 403 if user is not the poster and submission is not auto-released', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'other-user-999' } },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'submissions') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: validSubmissionId,
                    listing_id: validListingId,
                    tester_id: validTesterId,
                    status: 'pending_review',
                    auto_release_at: new Date(Date.now() + 86400000).toISOString(), // future date
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'listings') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: validListingId,
                    poster_id: validPosterId, // different poster!
                    rate_per_tester: 100,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const req = new NextRequest('http://localhost:3000/api/payout', {
        method: 'POST',
        body: JSON.stringify({ submission_id: validSubmissionId, amount: 100 }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.error).toContain('Forbidden');
    });

    it('should successfully process payout when authorized poster submits valid request', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'submissions') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: validSubmissionId,
                    listing_id: validListingId,
                    tester_id: validTesterId,
                    status: 'pending_review',
                  },
                  error: null,
                }),
                filter: () => Promise.resolve({ data: [{ status: 'approved' }], error: null }),
              }),
            }),
            update: () => ({
              eq: async () => ({ error: null }),
            }),
          };
        }
        if (table === 'listings') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: validListingId,
                    poster_id: validPosterId,
                    rate_per_tester: 100,
                    slots_count: 5,
                  },
                  error: null,
                }),
              }),
            }),
            update: () => ({
              eq: async () => ({ error: null }),
            }),
          };
        }
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { id: validTesterId, full_name: 'Jane Tester' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'payouts') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
                single: async () => ({
                  data: {
                    id: 'payout-123',
                    submission_id: validSubmissionId,
                    tester_id: validTesterId,
                    amount: 100,
                    status: 'completed',
                  },
                  error: null,
                }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: {
                    id: 'payout-123',
                    submission_id: validSubmissionId,
                    tester_id: validTesterId,
                    amount: 100,
                    status: 'pending',
                  },
                  error: null,
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                select: () => ({
                  single: async () => ({
                    data: {
                      id: 'payout-123',
                      submission_id: validSubmissionId,
                      tester_id: validTesterId,
                      amount: 100,
                      status: 'completed',
                      processor_payout_id: 'disb_123456',
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const req = new NextRequest('http://localhost:3000/api/payout', {
        method: 'POST',
        body: JSON.stringify({ submission_id: validSubmissionId, amount: 100 }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toContain('Payout processed successfully');
      expect(json.payout.status).toBe('completed');
    });
  });
});
