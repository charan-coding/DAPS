const crypto = require('crypto');

const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuXoGNW8QWRfpzBwU0urq
qSg8IdqmJ++4uyfPYVreMDNP5Dp4U6GwuV4Tu+tcvft4Igs2530AKvyunvgmvgrZ
7dnZzSvhKyRh3sBQ0AUD/7IjJJjyQksrHTdHOgE9l5DU6zJIXo+fFfHjZ756469b
8i1RERdUXde+VjVo+rbiEonZLox2zoxpUODBg5BmqtH2IZybqpGococPrE9ca4q6
xOY0VJS4C+LwIv0OfaAKr37dgpp16pYGfDh+JlyNBmkBfwEiTMxf8nyf26LNIyct
Tz5kB21qm+Rkw5t6clHrfoSaO0rXqDEUVcAKJNCfS0McYBd91SAS1cLXFW0p76rK
DwIDAQAB
-----END PUBLIC KEY-----`;

const jsonData = { test: "Hello" };

const encryptedBuffer = crypto.publicEncrypt(publicKey, Buffer.from(JSON.stringify(jsonData)));
console.log("Encrypted (base64):", encryptedBuffer.toString('base64'));
