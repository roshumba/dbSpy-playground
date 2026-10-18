/**
 * @jest-environment node
 *
 * scripts/check-node.js runs before `npm run dev`, `npm test` and `npm start`,
 * so a wrong Node version stops with a clear message instead of a crash.
 */
import { readFileSync } from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { checkNodeVersion } = require('../scripts/check-node.js');

describe('checkNodeVersion', () => {
  it('passes when the major version matches .nvmrc', () => {
    expect(checkNodeVersion('22.19.0', '22')).toBeNull();
  });

  it('explains how to fix a mismatch', () => {
    const message = checkNodeVersion('26.9.0', '22');
    expect(message).toContain('needs Node 22');
    expect(message).toContain("you're on 26.9.0");
    expect(message).toContain('nvm use');
  });
});

describe('npm scripts', () => {
  const { scripts } = JSON.parse(
    readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')
  );

  it.each(['predev', 'pretest', 'prestart'])('%s runs the Node check', (name) => {
    expect(scripts[name]).toBe('node scripts/check-node.js');
  });
});
