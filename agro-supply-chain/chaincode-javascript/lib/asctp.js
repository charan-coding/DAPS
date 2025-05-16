/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');
const { create } = require('domain');
class ASCTP extends Contract {

    async initLedger(ctx){
        await ctx.stub.putState("test","hello world");
        return "success";
    }

    async writeData(ctx, key, value){
        await ctx.stub.putState(key,value);
        return value;
    }

    async readData(ctx, key){
        var response = await ctx.stub.getState(key);
        return response.toString();
    }    

   
    async createDID(ctx, did, publicKey, serviceEndpoint) {
        const exists = await this.didExists(ctx, did);
        if (exists) {
            throw new Error(`DID ${did} already exists`);
        }

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

        await ctx.stub.putState(did, Buffer.from(JSON.stringify(didDocument)));
        return JSON.stringify(didDocument);
    }

    async readDID(ctx, ID) {
        let queryString ={}
        queryString.selector={"_id":ID}
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)
        return result
    }

    async didExists(ctx, did) {
        const didDocument = await ctx.stub.getState(did);
        return didDocument && didDocument.length > 0;
    }
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
    
    async getIteratorData(iterator){
        let outputArray = []

        while(true){
            let res=await iterator.next();
            let jsonValue = {}
            if(res.value && res.value.value.toString('utf-8')){
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