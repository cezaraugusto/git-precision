import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'cjs',
      syntax: ['node 18'],
      dts: false,
    },
  ],
});
