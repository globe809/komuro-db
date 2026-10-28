import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
const root = process.cwd()
export default defineConfig({
  plugins: [react()],
  resolve: { alias: [
    { find: /^.*\/hooks\/useFirestore$/, replacement: path.join(root, 'tests/ui/mockHooks.js') },
    { find: /^.*\/components\/ImageUpload$/, replacement: path.join(root, 'tests/ui/MockUpload.jsx') },
    { find: 'firebase/firestore', replacement: path.join(root, 'tests/ui/mockFirestore.js') },
    { find: /^\.\.\/\.\.\/firebase$/, replacement: path.join(root, 'tests/ui/mockFirebase.js') },
  ] },
  build: { outDir: '../improvements-qa', rollupOptions: { input: path.join(root, 'tests/admin-qa.html') } },
})
