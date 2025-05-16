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
        const { vcID, credentialData } = req.body.VC;

        if (!vcID || !credentialData) {
            return res.status(400).json({ error: 'vcID and credentialData are required' });
        }



        // Convert the 'issuedAt' timestamp to a Date object
        const issuedDate = new Date(credentialData.issuedAt);
        
        // Get the current date
        const currentDate = new Date();

        const differenceInTime = currentDate - issuedDate; 

        const differenceInDays = differenceInTime / (1000 * 3600 * 24);
        

        // if (differenceInDays > 1) {
        //     return res.json({ "Status": 'VC verification Failed', "Verification_Result": "VC is older than a day expired"});
        // } 

        // Create the VC hash
        const vcHash = crypto.createHash('sha256').update(JSON.stringify(credentialData)).digest('hex');

        // Verify the VC by submitting the transaction
        const result = await contract.evaluateTransaction('verifyVC', vcID, vcHash);
        console.log('VC verification has been evaluated');

        // Disconnect
        await gateway.disconnect();

        return res.json({ "Status": 'VC verified successfully', "Verification_Result": JSON.parse(result.toString()) });
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({ error: 'Failed to submit transaction' });
    }
});

module.exports = router;
