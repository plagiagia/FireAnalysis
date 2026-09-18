import { cpSync, existsSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function copyDataArchive() {
  return {
    name: 'copy-data-archive',
    closeBundle() {
      const source = path.resolve('Data')
      const destination = path.resolve('dist/Data')
      if (existsSync(source)) cpSync(source, destination, { recursive: true })
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), copyDataArchive()],
})
