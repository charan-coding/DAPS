const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Route to decrypt an encrypted string with a private key
router.post('/', async (req, res) => {

  const inpu  = req.body.name;
  let name=JSON.stringify(inpu)
  name=name.slice(1,name.length-1)
  if (!name) {
    return res.status(400).json({ error: 'Invalid or missing name parameter' });
  }

  const { encryptedText } = req.body; // Get encrypted text from request body

  if (!encryptedText) {
    return res.status(400).json({ error: 'Encrypted text is required' });
  }
  const privateKeyFilename = `../../privateKey_${name}.pem`;
  try {
    console.log(path.join(__dirname, privateKeyFilename))
    const privateKey = fs.readFileSync(path.join(__dirname, privateKeyFilename), 'utf8');
    

    console.log(privateKey)

    const encryptedBuffer = Buffer.from(encryptedText, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, encryptedBuffer);

    res.json({ decryptedText: decrypted.toString('utf8') });
  } catch (error) {
    res.status(500).json({ error: 'Error decrypting text' });
  }
});

module.exports = router;
