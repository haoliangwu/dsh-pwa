import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import z from "@deepseek-ai/schemastery";
//#region src/index.ts
/**
* DSH PWA plugin, node half.
*
* Makes a running `dsh web` instance installable as a PWA by serving the
* manifest, service worker, and icons under `${basePath}pwa/*` and rewriting
* index.html to point at them. `basePath` supports reverse-proxy deployments
* mounted at a sub-path instead of root. No client/browser half: everything
* happens host-side against `ctx.webServer`.
*/
/** Cordis plugin name. */
const name = "dsh-pwa";
/** Required services: the host web route registry + index transform taps. */
const inject = ["webServer"];
/**
* Normalize a config value into the canonical base prefix.
* - `''` or `'/'` → `'/'`
* - `'/dsh'` → `'/dsh/'`
* - `'dsh/'` → `'/dsh/'`
* - `'/dsh/'` → `'/dsh/'` (unchanged)
* Values bound by a leading `/` get one prepended; values containing `?` or
* `#` (query/hash separators) are rejected. Always starts and ends with `/`.
*/
const Config = z.object({ basePath: z.transform(z.string(), (value, options) => {
	if (value.includes("?") || value.includes("#")) throw new z.ValidationError(`basePath must not contain '?' or '#'`, options);
	const withSlash = value.startsWith("/") ? value : `/${value}`;
	return withSlash.endsWith("/") ? withSlash : `${withSlash}/`;
}).default("/") });
/**
* Build the PWA web manifest object for the given base path.
* @param basePath - canonical base prefix (e.g. `'/dsh/'`).
* @returns the manifest object with all URLs rooted at {@link basePath}.
*/
function buildManifest(basePath) {
	return {
		id: basePath,
		name: "DeepSeek Harness",
		short_name: "DSH",
		start_url: basePath,
		scope: basePath,
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#0f172a",
		icons: [
			{
				src: `${basePath}pwa/icon-192.png`,
				sizes: "192x192",
				type: "image/png",
				purpose: "any"
			},
			{
				src: `${basePath}pwa/icon-512.png`,
				sizes: "512x512",
				type: "image/png",
				purpose: "any"
			},
			{
				src: `${basePath}pwa/favicon.svg`,
				sizes: "any",
				type: "image/svg+xml",
				purpose: "any"
			}
		]
	};
}
/**
* Build the index.html transform: repoint the manifest + icon links and inject
* the service-worker registration script before `</body>`.
* @param basePath - normalized base prefix (e.g. `'/dsh/'`).
* @returns a pure html-to-html transform for {@link tapIndex}.
*/
function buildTapIndex(basePath) {
	const manifestLink = `<link rel="manifest" href="${basePath}pwa/manifest.webmanifest" />`;
	const iconLink = `<link rel="icon" type="image/svg+xml" href="${basePath}pwa/favicon.svg" />`;
	const swScript = `<script>if('serviceWorker' in navigator)window.addEventListener('load',function(){navigator.serviceWorker.register('${basePath}pwa/sw.js',{scope:'${basePath}'})})<\/script>`;
	return (html) => html.replace(/<link rel="manifest"[^>]*>/i, manifestLink).replace(/<link rel="icon"[^>]*>/i, iconLink).replace("</body>", `${swScript}</body>`);
}
/**
* Serve a static asset as a one-shot response handler. The file is read once
* at application time and cached; requests re-send the cached Buffer.
* @param file - asset path relative to `assets/`.
* @param contentType - Content-Type to send (no charset by default).
* @param extraHeaders - optional extra response headers (e.g. Service-Worker-Allowed).
* @returns a {@link WebRoute['handler']} serving the cached bytes.
*/
function serveStatic(file, contentType, extraHeaders = {}) {
	const buffer = readFileSync(fileURLToPath(new URL(`../assets/${file}`, import.meta.url)));
	return (_req, res) => {
		res.writeHead(200, {
			"Content-Type": contentType,
			"Content-Length": buffer.length,
			...extraHeaders
		});
		res.end(buffer);
	};
}
/** Raw paths under `${basePath}pwa/*` mapped to their static asset + content type. */
const STATIC_ASSETS = [
	[
		"icon-192.png",
		"icon-192.png",
		"image/png"
	],
	[
		"icon-512.png",
		"icon-512.png",
		"image/png"
	],
	[
		"favicon.svg",
		"favicon.svg",
		"image/svg+xml"
	]
];
/**
* Register the PWA routes and index transform.
* @param ctx - host plugin context carrying the webServer service.
* @param config - validated {@link Config}.
*/
function apply(ctx, config) {
	const { basePath } = config;
	const disposers = [
		ctx.webServer.register({
			kind: "exact",
			path: `${basePath}pwa/manifest.webmanifest`,
			handler: (_req, res) => {
				res.writeHead(200, { "Content-Type": "application/manifest+json" });
				res.end(JSON.stringify(buildManifest(basePath)));
			}
		}),
		ctx.webServer.register({
			kind: "exact",
			path: `${basePath}pwa/sw.js`,
			handler: serveStatic("sw.js", "text/javascript", { "Service-Worker-Allowed": basePath })
		}),
		...STATIC_ASSETS.map(([route, file, contentType]) => ctx.webServer.register({
			kind: "exact",
			path: `${basePath}pwa/${route}`,
			handler: serveStatic(file, contentType)
		})),
		ctx.webServer.tapIndex(buildTapIndex(basePath))
	];
	ctx.effect(() => () => {
		for (const dispose of disposers) dispose();
	});
}
//#endregion
export { Config, apply, buildManifest, buildTapIndex, inject, name };
