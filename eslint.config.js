import { defineConfig } from '@tofrankie/eslint'

export default defineConfig({
  ignores: ['.agents/**', '**/*.md'],
  typescript: true,
})
