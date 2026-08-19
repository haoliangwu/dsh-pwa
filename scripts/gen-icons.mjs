import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'node:fs'

const svg = readFileSync(new URL('../assets/favicon.svg', import.meta.url))
for (const size of [192, 512]) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  const png = resvg.render().asPng()
  writeFileSync(new URL(`../assets/icon-${size}.png`, import.meta.url), png)
  console.log(`generated assets/icon-${size}.png`)
}