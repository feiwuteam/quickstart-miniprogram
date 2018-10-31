import { resolve } from 'path';

const root = resolve(__dirname, '..');
const resolvePath = path => resolve(root, path);

export default {
    pkg: resolvePath('package.json'),
    app: resolvePath(''),
    appSrc: resolvePath('src'),
    appDist: resolvePath('dist'),
    appNodeModules: resolvePath('node_modules')
};