import { describe, expect, it } from 'vitest';
import { buildAreaPreviewHtml, PREVIEW_RADIUS_METERS, type PreviewColors } from './areaPreviewHtml';

const colors: PreviewColors = {
  background: 'bg-token', circle: 'circle-token', circleFill: 'fill-token', centre: 'centre-token', attribution: 'attr-token', attributionBg: 'attrbg-token',
};

describe('area preview page (dashboard)', () => {
  it('is not built without a tiles key, so the keyless "API KEY REQUIRED" watermark is never requested', () => {
    expect(buildAreaPreviewHtml({ lat: -1.95, lng: 30.09, key: '', colors })).toBeNull();
    expect(buildAreaPreviewHtml({ lat: -1.95, lng: 30.09, key: '  ', colors })).toBeNull();
  });

  it('is not built without a usable centre', () => {
    expect(buildAreaPreviewHtml({ lat: NaN, lng: 30.09, key: 'k', colors })).toBeNull();
  });

  it('draws a dashed circle of about 1 km, never a pin, and keeps the CARTO attribution visible', () => {
    const html = buildAreaPreviewHtml({ lat: -1.954, lng: 30.0913, key: 'abc', colors })!;
    expect(PREVIEW_RADIUS_METERS).toBe(1000);
    expect(html).toContain('L.circle([lat, lng], { radius: 1000');
    expect(html).toContain("dashArray: '6 6'");
    expect(html).not.toContain('L.marker');
    expect(html).toContain('&copy; OpenStreetMap contributors, &copy; CARTO');
  });

  it('puts the key in the tile URL, encoded, and tells its parent when tiles load or fail', () => {
    const html = buildAreaPreviewHtml({ lat: -1.95, lng: 30.09, key: 'a b&c', colors })!;
    expect(html).toContain('basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=a%20b%26c');
    expect(html).toContain("'area-preview:' + msg");
    expect(html).toContain("finish('ready')");
    expect(html).toContain("finish('failed')");
    // Tiles are plain image requests, not CORS fetches, so the page needs no Origin of its own.
    expect(html).not.toContain('crossOrigin: true');
  });

  it('takes colours from the caller and strips anything that could leave a quoted value', () => {
    const html = buildAreaPreviewHtml({ lat: -1.95, lng: 30.09, key: 'k', colors: { ...colors, circle: "x'; alert(1); '" } })!;
    expect(html).toContain("color: 'x; alert(1); ',");
    expect(html).not.toContain("x'; alert(1)");
  });

  it('frames the area before any layer is added, and never asks the circle to measure itself on an unloaded map', () => {
    const html = buildAreaPreviewHtml({ lat: -1.95, lng: 30.09, key: 'k', colors })!;
    // circle.getBounds() throws on a map with no view yet, which silently ended the script and left an empty frame.
    expect(html).not.toContain('circle.getBounds');
    expect(html.indexOf('map.fitBounds(')).toBeGreaterThan(-1);
    expect(html.indexOf('map.fitBounds(')).toBeLessThan(html.indexOf('L.tileLayer('));
    expect(html.indexOf('map.fitBounds(')).toBeLessThan(html.indexOf('L.circle('));
  });

  it('turns any script error into "failed", never into a frame that waits for a message that will not come', () => {
    const html = buildAreaPreviewHtml({ lat: -1.95, lng: 30.09, key: 'k', colors })!;
    expect(html).toContain("window.onerror = function () { finish('failed'); return true; };");
  });
});
