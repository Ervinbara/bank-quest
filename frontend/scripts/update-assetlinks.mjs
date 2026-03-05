import fs from 'node:fs'
import path from 'node:path'

const packageName = process.env.ANDROID_PACKAGE_NAME || 'com.ervinbara.finmateadvisor'
const fingerprintRawSingle = process.env.ANDROID_SHA256_FINGERPRINT || ''
const fingerprintRawMulti = process.env.ANDROID_SHA256_FINGERPRINTS || ''
const mergedRaw = [fingerprintRawSingle, fingerprintRawMulti].filter(Boolean).join(',')
const fingerprints = [...new Set(
  mergedRaw
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)
)]

if (fingerprints.length === 0) {
  console.error('Missing ANDROID_SHA256_FINGERPRINT or ANDROID_SHA256_FINGERPRINTS env var')
  process.exit(1)
}

const fingerprintRegex = /^([A-F0-9]{2}:){31}[A-F0-9]{2}$/
for (const fingerprint of fingerprints) {
  if (!fingerprintRegex.test(fingerprint)) {
    console.error(`Invalid fingerprint format: ${fingerprint}. Expected SHA-256 like AA:BB:...:FF`)
    process.exit(1)
  }
}

const filePath = path.resolve(process.cwd(), 'public/.well-known/assetlinks.json')
const payload = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: packageName,
      sha256_cert_fingerprints: fingerprints
    }
  }
]

fs.mkdirSync(path.dirname(filePath), { recursive: true })
fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
console.log(`assetlinks.json updated for package ${packageName}`)
