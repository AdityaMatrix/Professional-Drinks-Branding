// GitHub Pages only knows about real files, so opening /products directly would be a 404.
// It serves 404.html for unknown paths, so making that the app lets the router take over.
import { copyFile } from 'node:fs/promises';

await copyFile('dist/index.html', 'dist/404.html');
