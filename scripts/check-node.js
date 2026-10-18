// Stops `npm run dev`, `npm test` and `npm start` early when the running Node
// doesn't match .nvmrc. Plain JS with no dependencies, so it runs on any Node.
const fs = require('fs');
const path = require('path');

function checkNodeVersion(current, pinned) {
  if (current.split('.')[0] === pinned) return null;
  return (
    `✖ dbSpy needs Node ${pinned} (from .nvmrc), but you're on ${current}.\n` +
    "  Run `nvm use` (or your version manager's equivalent), then try again."
  );
}

if (require.main === module) {
  const pinned = fs.readFileSync(path.join(__dirname, '..', '.nvmrc'), 'utf8').trim();
  const message = checkNodeVersion(process.versions.node, pinned);
  if (message) {
    console.error(message);
    process.exit(1);
  }
}

module.exports = { checkNodeVersion };
