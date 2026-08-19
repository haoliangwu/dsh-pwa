import { describe, expect, it } from 'vitest'
import { Config, buildManifest, buildTapIndex } from './index.js'

const SAMPLE_HTML = `<!doctype html>
<html>
  <head>
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body></body>
</html>`

describe('Config', () => {
  it('defaults basePath to "/"', () => {
    expect(Config({})).toEqual({ basePath: '/' })
  })

  it('appends a trailing slash to "/dsh"', () => {
    expect(Config({ basePath: '/dsh' })).toEqual({ basePath: '/dsh/' })
  })

  it('prepends a leading slash to "dsh/"', () => {
    expect(Config({ basePath: 'dsh/' })).toEqual({ basePath: '/dsh/' })
  })

  it('leaves "/dsh/" unchanged', () => {
    expect(Config({ basePath: '/dsh/' })).toEqual({ basePath: '/dsh/' })
  })

  it('normalizes empty string to "/"', () => {
    expect(Config({ basePath: '' })).toEqual({ basePath: '/' })
  })

  it('rejects a basePath containing "?"', () => {
    expect(() => Config({ basePath: '?foo' })).toThrow()
  })
})

describe('buildManifest', () => {
  it('fills basePath into id/start_url/scope and icon srcs', () => {
    const manifest = buildManifest('/dsh/')
    expect(manifest.name).toBe('DeepSeek Harness')
    expect(manifest.short_name).toBe('DSH')
    expect(manifest.start_url).toBe('/dsh/')
    expect(manifest.scope).toBe('/dsh/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons).toHaveLength(3)
    expect(manifest.icons[0]).toMatchObject({ sizes: '192x192', type: 'image/png', src: '/dsh/pwa/icon-192.png' })
    expect(manifest.icons[1]).toMatchObject({ sizes: '512x512', type: 'image/png', src: '/dsh/pwa/icon-512.png' })
    expect(manifest.icons[2]).toMatchObject({ sizes: 'any', type: 'image/svg+xml', src: '/dsh/pwa/favicon.svg' })
  })

  it('roots URLs at "/" when basePath is "/"', () => {
    const manifest = buildManifest('/')
    expect(manifest.icons[0].src).toBe('/pwa/icon-192.png')
  })
})

describe('buildTapIndex', () => {
  it('repoints manifest + icon links and injects the SW registration', () => {
    const html = buildTapIndex('/dsh/')(SAMPLE_HTML)
    expect(html).toContain('<link rel="manifest" href="/dsh/pwa/manifest.webmanifest" />')
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/dsh/pwa/favicon.svg" />')
    expect(html).toContain(`navigator.serviceWorker.register('/dsh/pwa/sw.js',{scope:'/dsh/'})`)
    expect(html).toContain('</body>')
    expect(html.indexOf('serviceWorker')).toBeGreaterThan(html.indexOf('manifest'))
  })
})