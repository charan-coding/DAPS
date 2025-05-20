/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Hyperledger Fabric chaincode for decentralized identity and credential management.
 * Implements functionality for:
 *  - Writing and reading generic state data
 *  - Creating and querying DIDs
 *  - Issuing and verifying Verifiable Credentials (VCs)
 */


'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');
const { create } = require('domain');
class ASCTP extends Contract {
        /**
     * Initializes the ledger with a test key-value pair.
     */

    async initLedger(ctx){
        await ctx.stub.putState("test","hello world");
        return "success";
    }

        /**
     * Writes an arbitrary key-value pair to the ledger state.
     */


    async writeData(ctx, key, value){
        await ctx.stub.putState(key,value);
        return value;
    }

    /**
     * Reads a value from the ledger state using the given key.
     */

    async readData(ctx, key){
        var response = await ctx.stub.getState(key);
        return response.toString();
    }    

        /**
     * Creates and stores a new DID document on the ledger.
     * @param {string} did - The DID identifier
     * @param {string} publicKey - Public key associated with the DID
     * @param {string} serviceEndpoint - Endpoint for DID-based services
     */

   
    async createDID(ctx, did, publicKey, serviceEndpoint) {
        // Check if DID already exists on the ledger

        const exists = await this.didExists(ctx, did);
        if (exists) {
            throw new Error(`DID ${did} already exists`);
        }
        // Construct the DID document in compliance with W3C DID spec

        const didDocument = {
            '@context': 'https://www.w3.org/ns/did/v1',
            id: did,
            publicKey: publicKey,
            service: {
                id: `${did}#service`,
                type: 'VerifiableCredentialService',
                serviceEndpoint: serviceEndpoint,
            },
            owner: ctx.clientIdentity.getID(),
        };
        // Store the DID document in world state

        await ctx.stub.putState(did, Buffer.from(JSON.stringify(didDocument)));
        return JSON.stringify(didDocument);
    }

    /**
     * Queries the ledger for a DID document by CouchDB _id.
     */

    async readDID(ctx, ID) {
        // Build CouchDB rich query to fetch DID document by ID

        let queryString ={}
        queryString.selector={"_id":ID}
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)
        return result
    }

    /**
     * Checks whether a DID exists in the ledger.
     */

    async didExists(ctx, did) {
        const didDocument = await ctx.stub.getState(did);
        return didDocument && didDocument.length > 0;
    }

    /**
     * Issues a Verifiable Credential and stores its hash on the ledger.
     * @param {string} vcID - Unique ID for the VC
     * @param {string} issuerDID - DID of the credential issuer
     * @param {string} holderDID - DID of the credential holder
     * @param {Object} credentialData - The claims or credential subject
     * @param {string} vcHash - Hash of the VC for tamper detection
     * @param {string} issuanceDate - Date of issuance
     */


    async createVC(ctx, vcID, issuerDID, holderDID, credentialData, vcHash, issuanceDate) {
        // Verify that the issuer's DID exists
        const issuerDocument = await ctx.stub.getState(issuerDID);
        if (!issuerDocument || issuerDocument.length === 0) {
            throw new Error(`Issuer DID ${issuerDID} does not exist`);
        }

        // Verify that the holder's DID exists
        const holderDocument = await ctx.stub.getState(holderDID);
        if (!holderDocument || holderDocument.length === 0) {
            throw new Error(`Holder DID ${holderDID} does not exist`);
        }

        // Create a Verifiable Credential
        const vc = {
            '@context': 'https://www.w3.org/2018/credentials/v1',
            id: vcID,
            type: ['VerifiableCredential'],
            issuer: issuerDID,
            credentialSubject: {
                id: holderDID,
                ...credentialData,
            },
            
        };

        // Hash the VC for anchoring

        const vcRecord = {
            vcID: vcID,
            issuerDID: issuerDID,
            holderDID: holderDID,
            vcHash: vcHash,
            issuanceDate: vc.issuanceDate,
        };

        // Store the VC hash on the blockchain
        await ctx.stub.putState(vcID, Buffer.from(JSON.stringify(vcRecord)));

        return JSON.stringify(vcRecord);
    }

    /**
     * Verifies the integrity of a VC by comparing its stored hash.
     * @param {string} vcID - The credential ID
     * @param {string} vcHash - The hash of the VC to verify
     * @returns {Object} Verification result
     */

    async verifyVC(ctx, vcID, vcHash) {
        const storedVC = await ctx.stub.getState(vcID);
        if (!storedVC || storedVC.length === 0) {
            throw new Error(`VC ${vcID} does not exist`);
        }

        const vcRecord = JSON.parse(storedVC.toString());

        // Verify the VC hash matches
        if (vcRecord.vcHash !== vcHash) {
            throw new Error('VC has been tampered with');
        }

        return { valid: true, vcRecord };
    }
    

    /**
     * Helper function to process Fabric iterators and return JSON objects.
     * @param {Object} iterator - Fabric query iterator
     * @returns {Array} Parsed results array
     */

    async getIteratorData(iterator){
        let outputArray = []

        while(true){
            let res=await iterator.next();
            let jsonValue = {}
            if(res.value && res.value.value.toString('utf-8')){
                // Slice key and parse value as JSON
                let str=res.value.key
                str=str.slice(3,str.length)
                jsonValue.id = str;
                jsonValue.value = JSON.parse(res.value.value.toString('utf-8'));
                outputArray.push(jsonValue)
            }
            
            if(res.done){
                await iterator.close();
                return outputArray;
            }
        }
    }

}

module.exports = ASCTP;