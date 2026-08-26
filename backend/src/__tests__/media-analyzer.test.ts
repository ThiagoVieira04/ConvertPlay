import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MediaAnalyzerService } from '../services/media-analyzer/service.js';
import { YouTubeAnalyzer } from '../services/media-analyzer/youtube.js';

describe('YouTubeAnalyzer', () => {
  const analyzer = new YouTubeAnalyzer();

  describe('canHandle', () => {
    it('should handle youtube.com watch URLs', () => {
      assert.ok(analyzer.canHandle('https://www.youtube.com/watch?v=dQw4w9WgXcQ'));
    });

    it('should handle youtu.be short URLs', () => {
      assert.ok(analyzer.canHandle('https://youtu.be/dQw4w9WgXcQ'));
    });

    it('should handle playlist URLs', () => {
      assert.ok(
        analyzer.canHandle('https://www.youtube.com/playlist?list=PL-osiE80TeTsWmV9i9c58mdDCSskIFdDS'),
      );
    });

    it('should not handle non-YouTube URLs', () => {
      assert.ok(!analyzer.canHandle('https://vimeo.com/123456'));
    });

    it('should not handle invalid URLs', () => {
      assert.ok(!analyzer.canHandle('not-a-url'));
    });
  });

  describe('analyze', () => {
    it('should analyze a video URL', async () => {
      const result = await analyzer.analyze('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      assert.ok(result.success);
      if (result.success) {
        assert.equal(result.data.type, 'video');
        assert.equal(result.data.id, 'dQw4w9WgXcQ');
        assert.ok(result.data.title);
        assert.ok(result.data.thumbnail);
        assert.ok(typeof result.data.duration === 'number');
      }
    });

    it('should analyze a playlist URL', async () => {
      const result = await analyzer.analyze(
        'https://www.youtube.com/playlist?list=PL-osiE80TeTsWmV9i9c58mdDCSskIFdDS',
      );
      assert.ok(result.success);
      if (result.success) {
        assert.equal(result.data.type, 'playlist');
        assert.ok(result.data.title);
        assert.ok(Array.isArray(result.data.items));
        assert.ok(result.data.items.length > 0);
      }
    });

    it('should return error for unsupported URL format', async () => {
      const result = await analyzer.analyze('https://www.youtube.com/channel/UC123');
      assert.ok(!result.success);
      if (!result.success) {
        assert.equal(result.error.code, 'UNSUPPORTED_SOURCE');
      }
    });
  });
});

describe('MediaAnalyzerService', () => {
  const service = new MediaAnalyzerService();

  it('should analyze YouTube video URLs', async () => {
    const result = await service.analyze('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.ok(result.success);
  });

  it('should analyze YouTube playlist URLs', async () => {
    const result = await service.analyze(
      'https://www.youtube.com/playlist?list=PL-osiE80TeTsWmV9i9c58mdDCSskIFdDS',
    );
    assert.ok(result.success);
  });

  it('should reject unsupported sources', async () => {
    const result = await service.analyze('https://vimeo.com/123456');
    assert.ok(!result.success);
    if (!result.success) {
      assert.equal(result.error.code, 'UNSUPPORTED_SOURCE');
    }
  });

  it('should reject invalid URLs', async () => {
    const result = await service.analyze('not-a-url');
    assert.ok(!result.success);
    if (!result.success) {
      assert.equal(result.error.code, 'INVALID_URL');
    }
  });

  it('should reject empty URLs', async () => {
    const result = await service.analyze('');
    assert.ok(!result.success);
    if (!result.success) {
      assert.equal(result.error.code, 'INVALID_URL');
    }
  });

  it('should reject non-http protocols', async () => {
    const result = await service.analyze('ftp://example.com/video.mp4');
    assert.ok(!result.success);
    if (!result.success) {
      assert.equal(result.error.code, 'INVALID_URL');
    }
  });

  it('should handle URLs with extra whitespace', async () => {
    const result = await service.analyze('  https://www.youtube.com/watch?v=dQw4w9WgXcQ  ');
    assert.ok(result.success);
  });
});
