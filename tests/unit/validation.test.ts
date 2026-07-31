import { describe, it, expect } from 'vitest';
import {
  createListingSchema,
  taskResponseSchema,
  submitTestResponseSchema,
  CUSTOM_RATE_TIERS,
} from '@/lib/validation';

describe('Validation Schemas (lib/validation/index.ts)', () => {
  describe('createListingSchema', () => {
    const validListingData = {
      title: 'Usability Test for New Mobile App',
      description: 'We are looking for feedback on our checkout flow and user interface responsiveness.',
      rate_per_tester: 100,
      slots_count: 5,
      total_budget: 500, // 100 * 5
      review_window_minutes: 30,
      questions: [
        {
          question_text: 'Did you experience any friction during checkout?',
          requires_recording: false,
          requires_image: true,
        },
      ],
    };

    it('should validate a correct listing payload', () => {
      const result = createListingSchema.safeParse(validListingData);
      expect(result.success).toBe(true);
    });

    it('should reject titles that are too short (<5 chars)', () => {
      const invalidData = { ...validListingData, title: 'App' };
      const result = createListingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject rate_per_tester not in CUSTOM_RATE_TIERS', () => {
      const invalidData = { ...validListingData, rate_per_tester: 75, total_budget: 375 };
      const result = createListingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow slot size of 1 for preview round and between 3 and 100 for standard', () => {
      // Slot size 1
      const previewData = { ...validListingData, slots_count: 1, total_budget: 100 };
      expect(createListingSchema.safeParse(previewData).success).toBe(true);

      // Slot size 2 (invalid)
      const slot2Data = { ...validListingData, slots_count: 2, total_budget: 200 };
      expect(createListingSchema.safeParse(slot2Data).success).toBe(false);

      // Slot size 10 (valid)
      const slot10Data = { ...validListingData, slots_count: 10, total_budget: 1000 };
      expect(createListingSchema.safeParse(slot10Data).success).toBe(true);
    });

    it('should fail refinement if total_budget != rate_per_tester * slots_count', () => {
      const invalidBudget = { ...validListingData, total_budget: 999 };
      const result = createListingSchema.safeParse(invalidBudget);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Escrow verification failed');
      }
    });

    it('should reject review_window_minutes other than 30 or 60', () => {
      const invalidWindow = { ...validListingData, review_window_minutes: 45 };
      const result = createListingSchema.safeParse(invalidWindow);
      expect(result.success).toBe(false);
    });

    it('should require at least 1 question and at most 10 questions', () => {
      const noQuestions = { ...validListingData, questions: [] };
      expect(createListingSchema.safeParse(noQuestions).success).toBe(false);

      const tooManyQuestions = {
        ...validListingData,
        questions: Array(11).fill({ question_text: 'Valid question text here?' }),
      };
      expect(createListingSchema.safeParse(tooManyQuestions).success).toBe(false);
    });

    it('should validate demographic targeting fields when present', () => {
      const demographicData = {
        ...validListingData,
        target_age_group: '25-34',
        target_gender: 'female',
        target_employment_status: 'employed',
        target_tech_literacy: 'non_technical',
      };
      const result = createListingSchema.safeParse(demographicData);
      expect(result.success).toBe(true);
    });

    it('should validate quick impression fields when present', () => {
      const quickImpressionData = {
        ...validListingData,
        is_quick_impression: true,
        impression_duration_seconds: 10,
      };
      const result = createListingSchema.safeParse(quickImpressionData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid impression durations (<5 or >30)', () => {
      const durationTooShort = {
        ...validListingData,
        is_quick_impression: true,
        impression_duration_seconds: 4,
      };
      expect(createListingSchema.safeParse(durationTooShort).success).toBe(false);

      const durationTooLong = {
        ...validListingData,
        is_quick_impression: true,
        impression_duration_seconds: 31,
      };
      expect(createListingSchema.safeParse(durationTooLong).success).toBe(false);
    });

    it('should validate variants under A/B comparative testing config', () => {
      const correctVariants = {
        ...validListingData,
        variants: [
          { id: 'A', title: 'Variant A', url: 'https://a.test.com', weight: 40 },
          { id: 'B', title: 'Variant B', url: 'https://b.test.com', weight: 60 }
        ]
      };
      expect(createListingSchema.safeParse(correctVariants).success).toBe(true);

      const invalidSum = {
        ...validListingData,
        variants: [
          { id: 'A', title: 'Variant A', url: 'https://a.test.com', weight: 50 },
          { id: 'B', title: 'Variant B', url: 'https://b.test.com', weight: 40 }
        ]
      };
      const result = createListingSchema.safeParse(invalidSum);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('sum must be exactly 100');
      }
    });

    it('should validate target accessibility tags and parent round linkage', () => {
      const accessData = {
        ...validListingData,
        target_accessibility_tags: ['screen_reader', 'keyboard_only'],
        parent_listing_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
      };
      expect(createListingSchema.safeParse(accessData).success).toBe(true);

      const invalidAccess = {
        ...validListingData,
        target_accessibility_tags: ['invalid_tag_value']
      };
      expect(createListingSchema.safeParse(invalidAccess).success).toBe(false);
    });
  });

  describe('taskResponseSchema', () => {
    const validTaskResponse = {
      task_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      answer_text: 'The checkout button was easy to locate and click.',
      completed_successfully: true,
      time_on_task_seconds: 120,
      difficulty_rating: 2,
      recording_url: 'https://example.com/recording.webm',
      image_url: 'http://localhost:3000/uploads/screen.png',
    };

    it('should validate a correct task response', () => {
      const result = taskResponseSchema.safeParse(validTaskResponse);
      expect(result.success).toBe(true);
    });

    it('should reject non-UUID task_id', () => {
      const invalidId = { ...validTaskResponse, task_id: 'not-a-uuid' };
      const result = taskResponseSchema.safeParse(invalidId);
      expect(result.success).toBe(false);
    });

    it('should reject answer_text with less than 10 characters', () => {
      const shortAnswer = { ...validTaskResponse, answer_text: 'Too short' };
      const result = taskResponseSchema.safeParse(shortAnswer);
      expect(result.success).toBe(false);
    });

    it('should reject difficulty_rating outside 1..5', () => {
      expect(taskResponseSchema.safeParse({ ...validTaskResponse, difficulty_rating: 0 }).success).toBe(false);
      expect(taskResponseSchema.safeParse({ ...validTaskResponse, difficulty_rating: 6 }).success).toBe(false);
    });

    it('should reject non-HTTPS / non-localhost attachment URLs', () => {
      const insecureUrl = { ...validTaskResponse, recording_url: 'http://insecure-domain.com/video.mp4' };
      const result = taskResponseSchema.safeParse(insecureUrl);
      expect(result.success).toBe(false);
    });

    it('should validate first click tracking metrics when present', () => {
      const heatmapResponse = {
        ...validTaskResponse,
        first_click_x: 250,
        first_click_y: 480,
        first_click_time_ms: 1845
      };
      expect(taskResponseSchema.safeParse(heatmapResponse).success).toBe(true);

      const invalidCoords = {
        ...validTaskResponse,
        first_click_x: -10,
        first_click_y: 'not-a-number'
      };
      expect(taskResponseSchema.safeParse(invalidCoords).success).toBe(false);
    });
  });

  describe('submitTestResponseSchema', () => {
    const validSubmission = {
      listing_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      responses: [
        {
          task_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          answer_text: 'Everything worked cleanly without any issues.',
          completed_successfully: true,
          time_on_task_seconds: 60,
          difficulty_rating: 1,
        },
      ],
      device_fingerprint: 'fp_123456789',
      ip_address: '192.168.1.1',
    };

    it('should validate a valid submit test response payload', () => {
      const result = submitTestResponseSchema.safeParse(validSubmission);
      expect(result.success).toBe(true);
    });

    it('should reject empty responses array', () => {
      const emptyResponses = { ...validSubmission, responses: [] };
      const result = submitTestResponseSchema.safeParse(emptyResponses);
      expect(result.success).toBe(false);
    });
  });
});
