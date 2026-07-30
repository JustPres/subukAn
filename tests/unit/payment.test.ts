import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';
import {
  createPaymentLink,
  processGCashPayout,
  verifyWebhookSignature,
} from '@/lib/payment/paymongo';

describe.sequential('PayMongo Payment Module', () => {
  describe('createPaymentLink', () => {
    it('should generate a valid payment link response with amount converted to cents', async () => {
      const amount = 150;
      const description = 'Test Listing Payment';
      const referenceId = 'listing-uuid-123';

      const result = await createPaymentLink(amount, description, referenceId);

      expect(result).toHaveProperty('id');
      expect(result.id).toMatch(/^link_[a-f0-9]+/i);
      expect(result.reference_number).toBe(referenceId);
      expect(result.status).toBe('active');
      expect(result.url).toContain('https://checkout.paymongo.com/mock/');
      expect(result.url).toContain(`ref=${referenceId}`);
      expect(result.url).toContain(`amt=${amount * 100}`);
    });

    it('should call PayMongo API v1/links when not in sandbox mode', async () => {
      const originalKey = process.env.PAYMONGO_SECRET_KEY;
      process.env.PAYMONGO_SECRET_KEY = 'sk_live_actual_secret_key';

      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => {
        return {
          ok: true,
          json: async () => ({
            data: {
              id: 'link_real_123',
              attributes: {
                url: 'https://paymongo.page.link/real_link',
                reference_number: 'listing-uuid-123',
                status: 'unpaid',
              },
            },
          }),
        } as Response;
      });

      try {
        const result = await createPaymentLink(150, 'Test Description', 'listing-uuid-123');

        expect(fetchSpy).toHaveBeenCalledWith(
          'https://api.paymongo.com/v1/links',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Basic c2tfbGl2ZV9hY3R1YWxfc2VjcmV0X2tleTo=',
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }),
            body: JSON.stringify({
              data: {
                attributes: {
                  amount: 15000,
                  description: 'Test Description',
                  reference_number: 'listing-uuid-123',
                },
              },
            }),
          })
        );

        expect(result).toEqual({
          id: 'link_real_123',
          url: 'https://paymongo.page.link/real_link',
          reference_number: 'listing-uuid-123',
          status: 'unpaid',
        });
      } finally {
        if (originalKey === undefined || originalKey === 'undefined') {
          delete process.env.PAYMONGO_SECRET_KEY;
        } else {
          process.env.PAYMONGO_SECRET_KEY = originalKey;
        }
        fetchSpy.mockRestore();
      }
    });
  });

  describe('processGCashPayout', () => {
    it('should process GCash payout and return completed payout object', async () => {
      const params = {
        submissionId: 'sub-123',
        amount: 200,
        phoneNumber: '09171234567',
        idempotencyKey: 'idem-key-abc',
      };

      const result = await processGCashPayout(params);

      expect(result).toHaveProperty('id');
      expect(result.id).toMatch(/^disb_[a-f0-9]+/i);
      expect(result.status).toBe('completed');
      expect(result.amount).toBe(200);
      expect(result.recipient_phone).toBe('09171234567');
    });

    it('should call PayMongo API v1/disbursements when not in sandbox mode', async () => {
      const originalKey = process.env.PAYMONGO_SECRET_KEY;
      process.env.PAYMONGO_SECRET_KEY = 'sk_live_actual_secret_key';

      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => {
        return {
          ok: true,
          json: async () => ({
            data: {
              id: 'disb_real_456',
              attributes: {
                status: 'pending',
                amount: 20000,
                recipient: {
                  type: 'gcash',
                  phone_number: '09171234567',
                },
              },
            },
          }),
        } as Response;
      });

      try {
        const params = {
          submissionId: 'sub-123',
          amount: 200,
          phoneNumber: '09171234567',
          idempotencyKey: 'idem-key-abc',
        };

        const result = await processGCashPayout(params);

        expect(fetchSpy).toHaveBeenCalledWith(
          'https://api.paymongo.com/v1/disbursements',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Basic c2tfbGl2ZV9hY3R1YWxfc2VjcmV0X2tleTo=',
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Idempotency-Key': 'idem-key-abc',
            }),
            body: JSON.stringify({
              data: {
                attributes: {
                  amount: 20000,
                  recipient: {
                    type: 'gcash',
                    phone_number: '09171234567',
                  },
                  metadata: {
                    submission_id: 'sub-123',
                    idempotency_key: 'idem-key-abc',
                  },
                },
              },
            }),
          })
        );

        expect(result).toEqual({
          id: 'disb_real_456',
          status: 'pending',
          amount: 200,
          recipient_phone: '09171234567',
        });
      } finally {
        if (originalKey === undefined || originalKey === 'undefined') {
          delete process.env.PAYMONGO_SECRET_KEY;
        } else {
          process.env.PAYMONGO_SECRET_KEY = originalKey;
        }
        fetchSpy.mockRestore();
      }
    });
  });

  describe('verifyWebhookSignature', () => {
    const webhookSecret = 'whsec_test_secret_key_12345';
    const rawBody = JSON.stringify({ event: 'source.chargeable', data: { id: 'src_123' } });

    it('should return true for valid HMAC SHA256 test signature (te)', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const payload = `${timestamp}.${rawBody}`;
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      const header = `t=${timestamp},te=${validSignature}`;
      const isValid = verifyWebhookSignature(rawBody, header, webhookSecret);
      expect(isValid).toBe(true);
    });

    it('should return true for valid HMAC SHA256 live signature (li)', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const payload = `${timestamp}.${rawBody}`;
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      const header = `t=${timestamp},li=${validSignature}`;
      const isValid = verifyWebhookSignature(rawBody, header, webhookSecret);
      expect(isValid).toBe(true);
    });

    it('should return false when signature header is missing or null', () => {
      expect(verifyWebhookSignature(rawBody, null, webhookSecret)).toBe(false);
      expect(verifyWebhookSignature(rawBody, '', webhookSecret)).toBe(false);
    });

    it('should return false when webhook secret is empty', () => {
      const header = `t=1626789000,te=abcdef1234567890`;
      expect(verifyWebhookSignature(rawBody, header, '')).toBe(false);
    });

    it('should return false for invalid signature hex', () => {
      const timestamp = '1626789000';
      const invalidSignature = '0000000000000000000000000000000000000000000000000000000000000000';
      const header = `t=${timestamp},te=${invalidSignature}`;
      const isValid = verifyWebhookSignature(rawBody, header, webhookSecret);
      expect(isValid).toBe(false);
    });

    it('should return true for mock-signature header in non-production mode', () => {
      const isValid = verifyWebhookSignature(rawBody, 'mock-signature', webhookSecret);
      expect(isValid).toBe(true);
    });

    it('should return false for malformed header missing timestamp or signature', () => {
      expect(verifyWebhookSignature(rawBody, 'invalid-header-format', webhookSecret)).toBe(false);
      expect(verifyWebhookSignature(rawBody, 't=1234567', webhookSecret)).toBe(false);
      expect(verifyWebhookSignature(rawBody, 'te=abcdef123', webhookSecret)).toBe(false);
    });
  });
});
