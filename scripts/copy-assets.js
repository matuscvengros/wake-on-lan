const fs = require('fs');
const path = require('path');

const assets = ['index.html', 'styles.css'];
const src = path.join('src', 'renderer');
const dest = path.join('dist', 'renderer');

for (const file of assets) {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
}
