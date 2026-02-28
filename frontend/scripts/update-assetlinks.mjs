import fs from 'node:fs'
import path from 'node:path'

const packageName = process.env.ANDROID_PACKAGE_NAME || 'com.bankquest.app'
const fingerprintRaw = process.env.ANDROID_SHA256_FINGERPRINT || ''
const fingerprint = fingerprintRaw.trim().toUpperCase()

if (!fingerprint) {
  console.error('Missing ANDROID_SHA256_FINGERPRINT env var')
  process.exit(1)
}

const fingerprintRegex = /^([A-F0-9]{2}:){31}[A-F0-9]{2}$/
if (!fingerprintRegex.test(fingerprint)) {
  console.error('Invalid fingerprint format. Expected SHA-256 like AA:BB:...:FF')
  process.exit(1)
}

const filePath = path.resolve(process.cwd(), 'public/.well-known/assetlinks.json')
const payload = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: packageName,
      sha256_cert_fingerprints: [fingerprint]
    }
  }
]

fs.mkdirSync(path.dirname(filePath), { recursive: true })
fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
console.log(`assetlinks.json updated for package ${packageName}`)
