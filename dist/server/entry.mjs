import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_DHAs7d4K.mjs';
import { manifest } from './manifest_GymFDG4_.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/api/add_user.astro.mjs');
const _page3 = () => import('./pages/api/events.astro.mjs');
const _page4 = () => import('./pages/api/find_user.astro.mjs');
const _page5 = () => import('./pages/api/get_events.astro.mjs');
const _page6 = () => import('./pages/api/get_user.astro.mjs');
const _page7 = () => import('./pages/api/outbox.astro.mjs');
const _page8 = () => import('./pages/api/remove_event.astro.mjs');
const _page9 = () => import('./pages/api/signout.astro.mjs');
const _page10 = () => import('./pages/calendar.astro.mjs');
const _page11 = () => import('./pages/contact.astro.mjs');
const _page12 = () => import('./pages/homepage.astro.mjs');
const _page13 = () => import('./pages/register.astro.mjs');
const _page14 = () => import('./pages/signin.astro.mjs');
const _page15 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/node.js", _page0],
    ["src/pages/about.astro", _page1],
    ["src/pages/api/add_user.ts", _page2],
    ["src/pages/api/events.ts", _page3],
    ["src/pages/api/find_user.ts", _page4],
    ["src/pages/api/get_events.ts", _page5],
    ["src/pages/api/get_user.ts", _page6],
    ["src/pages/api/outbox.ts", _page7],
    ["src/pages/api/remove_event.ts", _page8],
    ["src/pages/api/signout.ts", _page9],
    ["src/pages/calendar.astro", _page10],
    ["src/pages/contact.astro", _page11],
    ["src/pages/homepage.astro", _page12],
    ["src/pages/register.astro", _page13],
    ["src/pages/signin.astro", _page14],
    ["src/pages/index.astro", _page15]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "mode": "standalone",
    "client": "file:///Users/jakelee/calendar-project-group/dist/client/",
    "server": "file:///Users/jakelee/calendar-project-group/dist/server/",
    "host": false,
    "port": 4321,
    "assets": "_astro",
    "experimentalStaticHeaders": false
};
const _exports = createExports(_manifest, _args);
const handler = _exports['handler'];
const startServer = _exports['startServer'];
const options = _exports['options'];
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { handler, options, pageMap, startServer };
