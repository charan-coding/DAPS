/**
 * Encrypts a Verifiable Credential using a given public RSA key.
 */


const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { jsonData, publicKey } = req.body;

  if (!jsonData || !publicKey) {
    return res.status(400).json({ error: 'jsonData and publicKey are required' });
  }

  try {
    // Dynamic import of jose
    const { importSPKI, CompactEncrypt } = await import('jose');

    let normalizedKey = publicKey.replace(/\\n/g, '\n').trim();

    if (!normalizedKey.includes('-----BEGIN PUBLIC KEY-----')) {
      normalizedKey = `-----BEGIN PUBLIC KEY-----\n${normalizedKey}`;
    }
    if (!normalizedKey.includes('-----END PUBLIC KEY-----')) {
      normalizedKey = `${normalizedKey}\n-----END PUBLIC KEY-----`;
    }

    const key = await importSPKI(normalizedKey, 'RSA-OAEP');
    const plaintext = Buffer.from(JSON.stringify(jsonData), 'utf8');

    const jwe = await new CompactEncrypt(plaintext)
      .setProtectedHeader({ alg: 'RSA-OAEP', enc: 'A256GCM' })
      .encrypt(key);

    res.json({ encryptedText: jwe });

  } catch (error) {
    console.error("Encryption error:", error);
    res.status(500).json({ error: 'Error encrypting JSON data', details: error.message });
  }
});

module.exports = router;
