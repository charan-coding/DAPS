const express = require('express');

const app = express();
const port = 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const createDID_org1Router = require('./src/routes/createDID_org1');
app.use('/api/createDID_org1', createDID_org1Router);

const createDID_org2Router = require('./src/routes/createDID_org2');
app.use('/api/createDID_org2', createDID_org2Router);

const verifyVCRouter = require('./src/routes/verifyVC');
app.use('/api/verifyVC', verifyVCRouter);

const createVCRouter = require('./src/routes/createVC');
app.use('/api/createVC', createVCRouter);

const getDIDRouter = require('./src/routes/getDID');
app.use('/api/getDID', getDIDRouter);

const createKeypairRouter = require('./src/routes/createKeypair');
app.use('/api/createKeypair', createKeypairRouter);

const encryptChallengeRouter = require('./src/routes/encryptChallenge');
app.use('/api/encryptChallenge', encryptChallengeRouter);

const decryptResponseRouter = require('./src/routes/decryptResponse');
app.use('/api/decryptResponse', decryptResponseRouter);

const encryptVCRouter = require('./src/routes/encryptVC.js');
app.use('/api/encryptVC', encryptVCRouter);

const decryptVCRouter = require('./src/routes/decryptVC');
app.use('/api/decryptVC', decryptVCRouter);


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
