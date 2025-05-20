/**
 * API endpoint to create and store a new DID document on the ledger for Org1.
 * Expects `did`, `publicKey`, in the request body.
 */

const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const express = require('express');
const router = express.Router();

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
        
        const { did, publicKey, serviceEndpoint } = req.body;

        if (!did || !publicKey || !serviceEndpoint) {
            return res.status(400).json({ error: 'DID, publicKey, and serviceEndpoint are required' });
        }


        await contract.submitTransaction('createDID', did, publicKey, serviceEndpoint);
        console.log('DID creation transaction has been submitted');



        
    
        // Disconnect from the gateway.
        await gateway.disconnect();

        res.json({ "Status": 'DID created successfully', "DID": did });
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({ error: 'Failed to submit transaction' });
    }
});

module.exports = router;
