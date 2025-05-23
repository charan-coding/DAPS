/**
 * Generates an RSA public-private keypair and saves them as PEM files.
 * Accepts `name` in the request body to customize file names.
 */

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');

const router = express.Router();


router.post('/', async (req, res) => {
  try {
    const inpu  = req.body.name;
    let name=JSON.stringify(inpu)
    name=name.slice(1,name.length-1)
    if (!name) {
      return res.status(400).json({ error: 'Invalid or missing name parameter' });
    }

    // Generate a 2048-bit RSA keypair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048, 
      publicKeyEncoding: {
        type: 'spki',        
        format: 'pem',      
      },
      privateKeyEncoding: {
        type: 'pkcs8',      
        format: 'pem',      
      },
    });

    // Save keys to PEM files with a name suffix

    const publicKeyFilename = `publicKey_${name}.pem`;
    const privateKeyFilename = `privateKey_${name}.pem`;
    console.log(publicKeyFilename)

    fs.writeFileSync(publicKeyFilename, publicKey, 'utf8');
    fs.writeFileSync(privateKeyFilename, privateKey, 'utf8');

    // Send the keys as the response
    res.json({
      publicKey,
      privateKey,
    });

  } catch (error) {
    res.status(500).json({ error: 'Error generating keys' });
  }
});

module.exports = router;
