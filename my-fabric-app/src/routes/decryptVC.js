/**
 * Decrypts an encrypted Verifiable Credential using a private RSA key.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.post('/', async (req, res) => {
  const inpu = req.body.name;
  let name = JSON.stringify(inpu);
  name = name.slice(1, name.length - 1);

  if (!name) {
    return res.status(400).json({ error: 'Invalid or missing name parameter' });
  }

  const { encryptedText } = req.body;

  if (!encryptedText) {
    return res.status(400).json({ error: 'Encrypted text is required' });
  }

  const privateKeyPath = path.join(__dirname, `../../privateKey_${name}.pem`);
  // Fetch private key and perform RSA decryption using provided private key

  try {
    // Load the private key from file
    const privateKeyPem = fs.readFileSync(privateKeyPath, 'utf8');

    // Dynamically import the jose library
    const { importPKCS8, compactDecrypt } = await import('jose');

    // Import the PEM key for RSA-OAEP decryption
    const key = await importPKCS8(privateKeyPem, 'RSA-OAEP');

    // Decrypt the compact JWE
    const { plaintext } = await compactDecrypt(encryptedText, key);

    const decryptedJson = JSON.parse(Buffer.from(plaintext).toString('utf8'));

    res.json({ decryptedJson });

  } catch (error) {
    console.error("Decryption error:", error);
    res.status(500).json({ error: 'Error decrypting text', details: error.message });
  }
});

module.exports = router;
