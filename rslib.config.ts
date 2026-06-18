import {defineConfig} from '@rslib/core'

export default defineConfig({
  lib: [
    {
      format: 'cjs',
      syntax: ['node 18'],
      dts: false
    }
  ],
  tools: {
    // Use deterministic (content-hashed) module IDs so the bundle is identical
    // whether built standalone or inside the monorepo, where dependencies
    // resolve at different node_modules depths. Keeps the dist-freshness CI
    // gate stable across build contexts.
    rspack: {
      optimization: {
        moduleIds: 'deterministic'
      }
    }
  }
})
