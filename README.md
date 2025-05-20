# Distributed Authentication and Privacy Scheme

This project implements a **Hyperledger Fabric-based decentralized identity and verifiable credential system** that allows organizations to issue, encrypt, decrypt, and verify credentials using DIDs (Decentralized Identifiers). The backend simulates multiple organizations participating in identity verification and credential exchange.

---

## 🛠 Prerequisites

- Docker & Docker Compose
- Node.js (v14+ recommended)
- Fabric Binaries (e.g., `peer`, `cryptogen`, etc.)
- Fabric Samples (`test-network`)

---

## Quickstart

### 1. Run the Full Setup

```bash
chmod +x setup.sh
./setup.sh
```

This script will:

- Start the Fabric test network with CouchDB and CA
- Deploy the `ASCTP` chaincode from the directory:
  ```
  ../Distributed-authentication-and-privacy-scheme/chaincode-javascript/
  ```
- Add Org3 to the network
- Approve and commit chaincode for Org3
- Enroll admins and register users for all three orgs
- Run the main.js script (for initial testing or configuration)

---

## 📡 API Usage Workflow

After running `setup.sh`, use the exposed API endpoints in this order:

1. **Create DIDs and Keys**  
   - Generate public-private keypairs  
   - Create and store DIDs on the blockchain

2. **Issue a Verifiable Credential (VC)**  
   - Construct VC from issuer to holder  
   - Store VC hash and metadata on-chain

3. **Encrypt the VC**  
   - Encrypt using holder's public key

4. **Decrypt the VC**  
   - Decrypt using holder's private key

5. **Verify the VC**  
   - Check hash match for tamper detection

---

## Project Structure

```bash
.
├── setup.sh                            # Automation script for full setup
├── chaincode-javascript/              # Fabric smart contract (ASCTP)
├── my-fabric-app/                     # API and interaction layer
│   ├── enrollAdmin.js
│   ├── registerUser.js
│   ├── createDID_org2.js
│   ├── createKeypair.js
│   ├── createVC.js
│   ├── encryptVC.js
│   ├── decryptVC.js
│   ├── verifyVC.js
│   └── ...
└── test-network/                      # Fabric test network with CA and CouchDB
```
