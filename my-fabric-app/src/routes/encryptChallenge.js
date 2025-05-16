const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Route to encrypt a string with a public key
router.post('/', async (req, res) => {
  const { text, publicKey } = req.body; // Get text and public key from request body
  
  if (!text || !publicKey) {
    return res.status(400).json({ error: 'Text and publicKey are required' });
  }

  try {
    // Encrypt the text with the public key using RSA encryption
    const buffer = Buffer.from(text, 'utf8');
    const encrypted = crypto.publicEncrypt(publicKey, buffer);

    // Send back the encrypted string in base64 format
    res.json({ encryptedText: encrypted.toString('base64') });
  } catch (error) {
    res.status(500).json({ error: 'Error encrypting text' });
  }
});

module.exports = router;
