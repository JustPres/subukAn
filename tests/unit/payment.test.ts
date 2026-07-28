import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  createPaymentLink,
  processGCashPayout,
  verifyWebhookSignature,
} from '@/lib/payment/paymongo';

describe('PayMongo Payment Module', () => {
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
