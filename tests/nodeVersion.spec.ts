/**
 * @jest-environment node
 *
 * Keeps every place that picks a Node version pointed at .nvmrc, so local dev,
 * CI and contributors run the same one. Node 26 removed SlowBuffer, which
 * jsonwebtoken still depends on (via jwa → buffer-equal-constant-time).
 */
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '..');
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

describe('Node version pin', () => {
  it('.nvmrc names a single major version', () => {
    expect(existsSync(path.join(root, '.nvmrc'))).toBe(true);
    expect(read('.nvmrc').trim()).toMatch(/^\d+$/);
  });

  it('CI reads the version from .nvmrc instead of hardcoding one', () => {
    const workflow = read('.github/workflows/node.js.yml');
    expect(workflow).toMatch(/node-version-file:\s*['"]?\.nvmrc['"]?/);
    expect(workflow).not.toMatch(/^\s*node-version:/m);
  });

  it('package.json engines allows the pinned version and rules out Node 26', () => {
    const pinned = read('.nvmrc').trim();
    const { engines } = JSON.parse(read('package.json'));
    expect(engines.node).toBe(`>=${pinned} <26`);
  });

  it('tests run on the pinned Node version (run `nvm use` if this fails)', () => {
    const major = process.versions.node.split('.')[0];
    expect(major).toBe(read('.nvmrc').trim());
  });
});
