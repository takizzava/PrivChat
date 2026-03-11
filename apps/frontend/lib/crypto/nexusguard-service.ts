/**
 * NexusGuard hybrid key establishment profile - service abstraction.
 * NOTE: This file intentionally does NOT implement crypto.
 * All real crypto MUST be implemented with audited libraries later.
 */

export type DeviceBundlePublic = {
  deviceId: string;
  userId: number;
  createdAt: string;
  identityKey: string;
  signingKey: string;
  oneTimePreKeys: string[];
};

export type EncryptedEnvelope = {
  version: "nexusguard-v1";
  senderDeviceId: string;
  recipientDeviceId: string;
  ciphertext: string;
  cryptoSuite: string;
  metadata: Record<string, unknown>;
};

export interface NexusGuardService {
  generateDeviceBundle(userId: number): Promise<DeviceBundlePublic>;
  encryptForDevice(
    bundle: DeviceBundlePublic,
    plaintext: string
  ): Promise<EncryptedEnvelope>;
  decryptFromDevice(envelope: EncryptedEnvelope): Promise<string>;
}

export const nexusGuardService: NexusGuardService = {
  async generateDeviceBundle(_userId: number): Promise<DeviceBundlePublic> {
    throw new Error(
      "NexusGuard: crypto not implemented. Integrate audited library."
    );
  },
  async encryptForDevice(
    _bundle: DeviceBundlePublic,
    _plaintext: string
  ): Promise<EncryptedEnvelope> {
    throw new Error(
      "NexusGuard: crypto not implemented. Do not rely on plaintext."
    );
  },
  async decryptFromDevice(_envelope: EncryptedEnvelope): Promise<string> {
    throw new Error(
      "NexusGuard: crypto not implemented. Do not send sensitive data."
    );
  }
};

