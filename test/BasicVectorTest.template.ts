/*
 * Copyright 2021 SYMBOL
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Key, SymbolAddress, SymbolIdGenerator, SymbolNetwork } from '@core';
import { Converter } from '@utils';
import { toBufferLE } from 'bigint-buffer';
import { expect } from 'chai';
import * as fs from 'fs';
import * as JSONStream from 'JSONStream';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const KeyPairVectorTester = (KeyPair: any, testKeysVectorFile: string): void => {
    describe('key pair - test vector', () => {
        it('can extract from private key test vectors', (done) => {
            const stream = fs.createReadStream(testKeysVectorFile, { encoding: 'utf-8' });
            stream.pipe(
                JSONStream.parse([]).on('data', (data) => {
                    data.forEach((item: { privateKey: string; publicKey: string }) => {
                        // Act:
                        const keyPair = new KeyPair(Key.createFromHex(item.privateKey));

                        // Assert:
                        const message = ` from ${item.privateKey}`;
                        expect(keyPair.publicKey.toString(), `public ${message}`).equal(item.publicKey);
                        expect(keyPair.privateKey.toString(), `private ${message}`).equal(item.privateKey);
                    });
                    done();
                }),
            );
        });
    });
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const SignAndVerifyTester = (KeyPair: any, testSignVectorFile: string): void => {
    describe('sign & verify- test vector', () => {
        it('sign', (done) => {
            const stream = fs.createReadStream(testSignVectorFile, { encoding: 'utf-8' });
            stream.pipe(
                JSONStream.parse([]).on('data', (data) => {
                    data.forEach((item: { privateKey: string; data: string; signature: string }) => {
                        // Arrange:
                        const keyPair = new KeyPair(Key.createFromHex(item.privateKey));
                        const payload = Converter.hexToUint8(item.data);

                        // Act:
                        const signature = keyPair.sign(payload);
                        const isVerified = keyPair.verify(payload, signature);

                        // Assert:
                        const message = ` from ${item.privateKey}`;
                        expect(Converter.uint8ToHex(signature).toUpperCase(), `private ${message}`).to.deep.equal(item.signature);
                        expect(isVerified, `private ${message}`).to.equal(true);
                    });
                    done();
                }),
            );
        });
    });
};

export const AddressMosaicIdTester = (testSignVectorFile: string, testMosaicId = false): void => {
    describe('address & mosaicId - test vector', () => {
        it('address & mosaic', (done) => {
            const stream = fs.createReadStream(testSignVectorFile, { encoding: 'utf-8' });
            stream.pipe(
                JSONStream.parse([]).on('data', (vector) => {
                    // Arrange:
                    const networkList = SymbolNetwork.list();
                    networkList.forEach((network) => {
                        //Load test vector addresses
                        vector.forEach((item: { [x: string]: any }) => {
                            const networkName = network.name.charAt(0).toUpperCase() + network.name.slice(1);
                            const addressKeyName = `address_${networkName}`.replace('_t', 'T');
                            const mosaicKeyName = `mosaicId_${networkName}`.replace('_t', 'T');

                            // Act + Assert:
                            const rawAddress = network.createAddressFromPublicKey(Key.createFromHex(item.publicKey));
                            const address = new SymbolAddress(rawAddress);
                            expect(item[addressKeyName]).to.be.equal(address.encoded);
                            if (testMosaicId) {
                                const mosaicId = SymbolIdGenerator.generateMosaicId(address, toBufferLE(BigInt(item['mosaicNonce']), 4));
                                expect(item[mosaicKeyName]).to.be.equal(mosaicId.toString(16).toLocaleUpperCase().padStart(16, '0'));
                            }
                        });
                    });
                    done();
                }),
            );
        });
    });
};
