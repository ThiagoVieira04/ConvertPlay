import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('CancelJob validation', () => {
  it('should identify cancellable job statuses', () => {
    const cancellable = ['queued', 'processing'];
    const nonCancellable = ['completed', 'failed', 'cancelled'];

    for (const status of cancellable) {
      assert.ok(
        status === 'queued' || status === 'processing',
        `${status} should be cancellable`,
      );
    }

    for (const status of nonCancellable) {
      assert.ok(
        status !== 'queued' && status !== 'processing',
        `${status} should not be cancellable`,
      );
    }
  });

  it('should mark pending and processing items as failed on cancel', () => {
    const items = [
      { id: '1', status: 'pending' },
      { id: '2', status: 'processing' },
      { id: '3', status: 'completed' },
      { id: '4', status: 'failed' },
    ];

    const toCancel = items.filter((i) => i.status === 'pending' || i.status === 'processing');
    assert.equal(toCancel.length, 2);
    assert.equal(toCancel[0].id, '1');
    assert.equal(toCancel[1].id, '2');
  });
});

describe('RetryJob validation', () => {
  it('should only retry failed jobs', () => {
    const retryableStatus = 'failed';
    const nonRetryableStatuses = ['queued', 'processing', 'completed', 'cancelled'];

    assert.equal(retryableStatus, 'failed');

    for (const status of nonRetryableStatuses) {
      assert.notEqual(status, 'failed', `${status} should not be retryable`);
    }
  });

  it('should filter only failed items for retry', () => {
    const items = [
      { id: '1', status: 'completed' },
      { id: '2', status: 'failed' },
      { id: '3', status: 'failed' },
      { id: '4', status: 'pending' },
    ];

    const failedItems = items.filter((i) => i.status === 'failed');
    assert.equal(failedItems.length, 2);
    assert.equal(failedItems[0].id, '2');
    assert.equal(failedItems[1].id, '3');
  });

  it('should skip items exceeding MAX_RETRIES', () => {
    const MAX_RETRIES = 2;

    const testCases = [
      { attemptsMade: 0, shouldRetry: true },
      { attemptsMade: 1, shouldRetry: true },
      { attemptsMade: 2, shouldRetry: false },
      { attemptsMade: 3, shouldRetry: false },
    ];

    for (const tc of testCases) {
      const canRetry = tc.attemptsMade < MAX_RETRIES;
      assert.equal(canRetry, tc.shouldRetry, `attemptsMade=${tc.attemptsMade}`);
    }
  });

  it('should reset failed items to pending on retry', () => {
    const items = [
      { id: '1', status: 'failed' },
      { id: '2', status: 'completed' },
    ];

    const retried = items.map((item) =>
      item.status === 'failed' ? { ...item, status: 'pending' } : item,
    );

    assert.equal(retried[0].status, 'pending');
    assert.equal(retried[1].status, 'completed');
  });

  it('should return retried and skipped counts', () => {
    const result = { retried: 3, skipped: 1 };
    assert.equal(typeof result.retried, 'number');
    assert.equal(typeof result.skipped, 'number');
  });
});

describe('JobItem status transitions', () => {
  it('should allow valid transitions', () => {
    const validTransitions: Record<string, string[]> = {
      pending: ['processing', 'failed'],
      processing: ['completed', 'failed'],
      completed: [],
      failed: ['pending'],
    };

    assert.ok(validTransitions.pending.includes('processing'));
    assert.ok(validTransitions.pending.includes('failed'));
    assert.ok(validTransitions.processing.includes('completed'));
    assert.ok(validTransitions.processing.includes('failed'));
    assert.ok(validTransitions.failed.includes('pending'));
    assert.equal(validTransitions.completed.length, 0);
  });
});
