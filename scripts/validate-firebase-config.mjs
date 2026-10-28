import { loadEnv } from 'vite'
import { readFileSync } from 'node:fs'
const env = loadEnv('production', process.cwd(), 'VITE_')
const required = ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID', 'APP_ID']
for (const field of required) if (!env[`VITE_FIREBASE_${field}`]?.trim()) throw new Error(`Missing Firebase web configuration: ${field}`)
const config = JSON.parse(readFileSync('firebase.json', 'utf8'))
if (env.VITE_FIREBASE_PROJECT_ID !== 'komuro-db' || config.hosting.site !== 'tk56') throw new Error('Deployment must target komuro-db / tk56')
console.log('Firebase configuration validated: komuro-db / tk56')
