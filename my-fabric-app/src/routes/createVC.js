/**
 * Creates and stores a Verifiable Credential (VC) on the blockchain.
 */

const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

router.post('/', async (req, res) => {
    try {
        // Load the network configuration
        const ccpPath = path.resolve(__dirname, '..','..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        console.log(`${ccpPath}`);
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system-based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        console.log(`Wallet path: ${walletPath}`);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return res.status(400).json({ error: 'User identity not found' });
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('asctp');
        
        const { vcID, issuerDID, holderDID, credentialData } = req.body;

        if (!vcID || !issuerDID || !holderDID || !credentialData) {
            return res.status(400).json({ error: 'vcID, issuerDID, holderDID, and credentialData are required' });}
        // Create the VC hash
        const vcHash = crypto.createHash('sha256').update(JSON.stringify(credentialData)).digest('hex');

        // Submit the transaction to create the VC
        // Date is inputed since getting date inside the chain causes consensus issues
        await contract.submitTransaction('createVC', vcID, issuerDID, holderDID, JSON.stringify(credentialData), vcHash, new Date().toISOString());
        console.log('VC creation transaction has been submitted');

        // Disconnect
        await gateway.disconnect();

        res.json({ "Status": 'VC created successfully', "VC_ID": vcID, "Hash": vcHash });


    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({ error: 'Failed to submit transaction' });
    }
});

module.exports = router;
