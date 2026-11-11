import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Sell photos on the photographer's Events page. The button that duplicated the Go live tile is now Sell photos, which
 * opens the existing album form preset to a standalone PAID album; a publish that fails is shown with a retry instead of
 * being swallowed; an album buyers cannot find says so in the list. Reading the source checks this without a signed-in
 * session (the same way the archived-albums contract does).
 */
const SOURCE = readFileSync(path.join(__dirname, 'events.tsx'), 'utf8').replace(/\r\n/g, '\n');

describe('photographer Events page: Sell photos', () => {
  it('replaces the Host an event button on the events tab, leaving the Go live tiles and My hosted events alone', () => {
    expect(SOURCE).toContain('<i className="bi bi-tag-fill" aria-hidden="true" /> Sell photos');
    expect(SOURCE).not.toContain('<i className="bi bi-plus-lg" aria-hidden="true" /> {CREATE_LABEL.host}');
    expect(SOURCE).toContain('<HostEntryTiles caption={hostedCaption} />');
  });

  it('opens the existing album form preset to a standalone PAID album', () => {
    const handler = SOURCE.slice(SOURCE.indexOf('const handleSellPhotos'), SOURCE.indexOf('// Retry publishing'));
    expect(handler).toContain('handleOpenCreateAlbum()');
    expect(handler).toContain("setCreateAlbumMode('standalone')");
    expect(handler).toContain("setStandaloneAlbumType('PAID')");
    expect(handler).toContain('setSellPreset(true)');
    expect(SOURCE).toContain("params.get('sell') !== '1'");
    // The Get started row for a photographer is Sell photos too, and opens the same preset.
    expect(SOURCE).toContain("if (key === 'new-album') { setActiveTab('albums'); handleSellPhotos(); }");
  });

  it('every other way to open the album form clears the preset', () => {
    const open = SOURCE.slice(SOURCE.indexOf('const handleOpenCreateAlbum'), SOURCE.indexOf('const handleSellPhotos'));
    expect(open).toContain('setSellPreset(false)');
  });

  it('checks every Find my photos condition before saving, as field errors, not an alert or a disabled button', () => {
    expect(SOURCE).toContain('const errs = sellFieldErrors({');
    expect(SOURCE).toContain('if (Object.keys(errs).length > 0) return;');
    expect(SOURCE).toContain('<FieldError id="sell-title-error"');
    expect(SOURCE).toContain('<FieldError id="sell-price-error"');
    expect(SOURCE).toContain('<FieldError id="sell-photos-error"');
    expect(SOURCE).toContain('isUploadingAlbum || (!sellPreset && (');
  });

  it('shows the preset note and hides the event and FREE choices while selling', () => {
    expect(SOURCE).toContain('{sellPreset ? SELL_FORM_NOTE :');
    expect(SOURCE).toContain('{!sellPreset && (\n            <>');
    expect(SOURCE).toContain('{!sellPreset && (\n                <AlbumTypeSelector');
  });
});

describe('photographer Events page: publishing is never silent', () => {
  it('the publish step no longer swallows a failure', () => {
    const step = SOURCE.slice(SOURCE.indexOf('// 3. Auto-publish PAID standalone albums'), SOURCE.indexOf('const newAlbum: Album = {'));
    expect(step).not.toContain('catch { /* ignore */ }');
    expect(step).toContain('publishFailure = describePublishFailure({ status: pubRes.status, body: pubResult })');
    expect(step).toContain('publishFailure = describePublishFailure({ networkError: true })');
  });

  it('the result modal says it is being prepared, or why not, and Retry publishing only publishes', () => {
    expect(SOURCE).toContain("albumSuccessModal.outcome?.headline ?? 'Published to Face AI'");
    expect(SOURCE).toContain("Retry publishing");
    const retry = SOURCE.slice(SOURCE.indexOf('const retryPublishAlbum'), SOURCE.indexOf('// Deep link from Home'));
    expect(retry).toContain('/publish`');
    expect(retry).not.toContain('uploadImageToAlbum');
    expect(retry).not.toContain('/albums/paid');
  });

  it('a failed publish offers no share link, code or QR for an album buyers cannot find', () => {
    expect(SOURCE.split("albumSuccessModal.outcome?.state !== 'failed'").length - 1).toBeGreaterThanOrEqual(5);
  });

  it('marks an album that is not live in both the grid and the list, with a way to publish', () => {
    expect(SOURCE.split('data-testid="not-visible-badge"').length - 1).toBe(2);
    expect(SOURCE.split('· Publish').length - 1).toBe(2);
  });
});

describe('photographer Events page: large albums are indexed in the background', () => {
  it('carries the indexing totals from the publish answer and follows face-status while the modal is open', () => {
    expect(SOURCE).toContain("pubResult?.data?.indexing === true");
    expect(SOURCE).toContain('/face-status`');
    expect(SOURCE).toContain('outcomeFromIndexing(json?.data?.indexing)');
    expect(SOURCE).toContain("albumSuccessModal?.outcome?.state === 'preparing'");
  });

  it('shows a progress bar and keeps the listing note while preparing, and stops polling when it is done or failed', () => {
    expect(SOURCE).toContain('role="progressbar"');
    expect(SOURCE).toContain("return () => { stopped = true; clearInterval(timer); };");
  });
});

