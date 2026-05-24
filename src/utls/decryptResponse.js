import CryptoJS from 'crypto-js';

const SECRET_KEY =
  import.meta.env
    .VITE_RESPONSE_SECRET_KEY;

export const decryptResponse =
  (encryptedResponse) => {
    try {
      if (
        !encryptedResponse?.iv ||
        !encryptedResponse?.data
      ) {
        return encryptedResponse;
      }

      /**
       * Same key generation
       * as backend sha256
       */
      const key =
        CryptoJS.SHA256(
          SECRET_KEY
        );

      /**
       * Parse IV + Cipher text
       */
      const iv =
        CryptoJS.enc.Hex.parse(
          encryptedResponse.iv
        );

      const encryptedHex =
        CryptoJS.enc.Hex.parse(
          encryptedResponse.data
        );

      const encrypted =
        CryptoJS.lib.CipherParams.create(
          {
            ciphertext:
              encryptedHex
          }
        );

      /**
       * AES-256-CBC decrypt
       */
      const decrypted =
        CryptoJS.AES.decrypt(
          encrypted,
          key,
          {
            iv,
            mode:
              CryptoJS.mode.CBC,
            padding:
              CryptoJS.pad.Pkcs7
          }
        );

      const text =
        decrypted.toString(
          CryptoJS.enc.Utf8
        );

      if (!text) {
        throw new Error(
          'Failed to decrypt response'
        );
      }

      return JSON.parse(
        text
      );
    } catch (error) {
      console.error(
        'Decrypt Error:',
        error
      );
      return null;
    }
  };