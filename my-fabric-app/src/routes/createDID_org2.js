const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    let gateway;
    try {
        // Load the network configuration for Org2
        const ccpPath = path.resolve(__dirname, '..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com', 'connection-org2.json');
        console.log(`Network configuration path: ${ccpPath}`);
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system-based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        console.log(`Wallet path: ${walletPath}`);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check to see if we've already enrolled the user for Org2.
        const identity = await wallet.get('appUserOrg2');
        if (!identity) {
            console.log('An identity for the user "appUserOrg2" does not exist in the wallet');
            return res.status(400).json({ error: 'User identity "appUserOrg2" not found in the wallet. Please register the user.' });
        }

        // Create a new gateway for connecting to Org2's peer node.
        gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUserOrg2', discovery: { enabled: true, asLocalhost: true } });

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
        console.error(`Failed to submit transaction: ${error.message}`);
        res.status(500).json({ error: `Failed to submit transaction: ${error.message}` });
    } finally {
        // Always disconnect the gateway to avoid memory leaks
        if (gateway) {
            await gateway.disconnect();
        }
    }
});

module.exports = router;
