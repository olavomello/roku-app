import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Roku Automated Channel Testing - Specification & Contracts', () => {
  it('verifies manifest conforms to Roku Certification Standards', () => {
    const manifestPath = path.join(process.cwd(), 'manifest');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    expect(manifestContent).toContain('title=');
    expect(manifestContent).toContain('major_version=');
    expect(manifestContent).toContain('minor_version=');
    expect(manifestContent).toContain('mm_icon_focus_hd=');
    expect(manifestContent).toContain('mm_icon_focus_fhd=');
    expect(manifestContent).toContain('splash_screen_fhd=');
  });

  it('verifies MainScene XML structure', () => {
    const mainSceneXml = path.join(process.cwd(), 'components', 'MainScene.xml');
    expect(fs.existsSync(mainSceneXml)).toBe(true);

    const xmlContent = fs.readFileSync(mainSceneXml, 'utf8');
    expect(xmlContent).toContain('<component name="MainScene" extends="Scene"');
    expect(xmlContent).toContain('HomeScene');
    expect(xmlContent).toContain('PlayerScene');
  });

  it('verifies HomeScene XML component structure', () => {
    const homeSceneXml = path.join(process.cwd(), 'components', 'screens', 'HomeScene.xml');
    expect(fs.existsSync(homeSceneXml)).toBe(true);

    const xmlContent = fs.readFileSync(homeSceneXml, 'utf8');
    expect(xmlContent).toContain('<component name="HomeScene" extends="Group"');
    expect(xmlContent).toContain('RowList');
    expect(xmlContent).toContain('VideoRowListItem');
  });

  it('verifies PlayerScene XML video component structure', () => {
    const playerSceneXml = path.join(process.cwd(), 'components', 'screens', 'PlayerScene.xml');
    expect(fs.existsSync(playerSceneXml)).toBe(true);

    const xmlContent = fs.readFileSync(playerSceneXml, 'utf8');
    expect(xmlContent).toContain('<component name="PlayerScene" extends="Group"');
    expect(xmlContent).toContain('Video');
  });

  it('verifies sample feed JSON compatibility with Roku Content Feed standard', () => {
    const feedPath = path.join(process.cwd(), 'feeds', 'sample-feed.json');
    expect(fs.existsSync(feedPath)).toBe(true);

    const feedData = JSON.parse(fs.readFileSync(feedPath, 'utf8'));
    expect(Array.isArray(feedData.videos)).toBe(true);
    expect(feedData.videos.length).toBeGreaterThan(0);

    const firstVideo = feedData.videos[0];
    expect(firstVideo).toHaveProperty('id');
    expect(firstVideo).toHaveProperty('title');
    expect(firstVideo).toHaveProperty('url');
    expect(firstVideo).toHaveProperty('thumbnail');
  });
});
