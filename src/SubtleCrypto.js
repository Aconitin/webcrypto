/**
 * Local dependencies
 */
const CryptoKey = require('./keys/CryptoKey')
const CryptoKeyPair = require('./keys/CryptoKeyPair')
const JsonWebKey = require('./keys/JsonWebKey')
const recognizedKeyUsages = require('./keys/recognizedKeyUsages')
const supportedAlgorithms = require('./algorithms')
const {InvalidAccessError, NotSupportedError} = require('./errors')
const {TextEncoder,TextDecoder} = require('text-encoding')

/**
 * SubtleCrypto
 */
class SubtleCrypto {

  /**
   * encrypt
   *
   * @description
   *
   * @param {AlgorithmIdentifier} algorithm
   * @param {CryptoKey} key
   * @param {BufferSource} data
   *
   * @returns {Promise}
   */
  encrypt (algorithm, key, data) {
    data = data.slice()

    let normalizedAlgorithm = supportedAlgorithms.normalize('encrypt', algorithm)

    if (normalizedAlgorithm instanceof Error) {
      return Promise.reject(normalizedAlgorithm)
    }

    return new Promise((resolve, reject) => {
      if (normalizedAlgorithm.name !== key.algorithm.name) {
        throw new InvalidAccessError('Algorithm does not match key')
      }

      if (!key.usages.includes('encrypt')) {
        throw new InvalidAccessError('Key usages must include "encrypt"')
      }

      let ciphertext = normalizedAlgorithm.encrypt(algorithm,key, data)

      resolve(ciphertext)
    })
  }

  /**
   * decrypt
   *
   * @description
   *
   * @param {AlgorithmIdentifier} algorithm
   * @param {CryptoKey} key
   * @param {BufferSource} data
   *
   * @returns {Promise}
   */
  decrypt (algorithm, key, data) {
    let normalizedAlgorithm = supportedAlgorithms.normalize('decrypt', algorithm)

    if (normalizedAlgorithm instanceof Error) {
      return Promise.reject(normalizedAlgorithm)
    }

    data = data.slice()

    return new Promise((resolve, reject) => {
      if (normalizedAlgorithm.name !== key.algorithm.name) {
        throw new InvalidAccessError('Algorithm does not match key')
      }

      if (!key.usages.includes('decrypt')) {
        throw new InvalidAccessError('Key usages must include "decrypt"')
      }

      let plaintext = normalizedAlgorithm.decrypt(algorithm, key, data)
      resolve(plaintext)
    })
  }

  /**
   * sign
   *
   * @description
   *
   * @param {AlgorithmIdentifier} algorithm
   * @param {CryptoKey} key
   * @param {BufferSource} data
   *
   * @returns {Promise}
   */
  sign (algorithm, key, data) {
    data = data.slice()

    let normalizedAlgorithm = supportedAlgorithms.normalize('sign', algorithm)

    if (normalizedAlgorithm instanceof Error) {
      return Promise.reject(normalizedAlgorithm)
    }

    return new Promise((resolve, reject) => {
      if (normalizedAlgorithm.name !== key.algorithm.name) {
        throw new InvalidAccessError('Algorithm does not match key')
      }

      if (!key.usages.includes('sign')) {
        throw new InvalidAccessError('Key usages must include "sign"')
      }

      let result = normalizedAlgorithm.sign(key, data)

      resolve(result)
    })
  }

  /**
   * verify
   *
   * @description
   *
   * @param {AlgorithmIdentifier} algorithm
   * @param {CryptoKey} key
   * @param {BufferSource} signature
   * @param {BufferSource} data
   *
   * @returns {Promise}
   */
  verify (alg, key, signature, data) {
    signature = signature.slice()

    let normalizedAlgorithm = supportedAlgorithms.normalize('verify', alg)

    if (normalizedAlgorithm instanceof Error) {
      return Promise.reject(normalizedAlgorithm)
    }

    data = data.slice()

    return new Promise((resolve, reject) => {
      if (normalizedAlgorithm.name !== key.algorithm.name) {
        throw new InvalidAccessError('Algorithm does not match key')
      }

      if (!key.usages.includes('verify')) {
        throw new InvalidAccessError('Key usages must include "verify"')
      }

      let result = normalizedAlgorithm.verify(key, signature, data)
      resolve(result)
    })
  }

  /**
   * digest
   *
   * @description
   *
   * @param {AlgorithmIdentifier} algorithm
   * @param {BufferSource} data
   *
   * @returns {Promise.<ArrayBuffer>}
   */
  digest (algorithm, data) {
    data = data.slice()

    let normalizedAlgorithm = supportedAlgorithms.normalize('digest', algorithm)

    if (normalizedAlgorithm instanceof Error) {
      return Promise.reject(normalizedAlgorithm)
    }

    return new Promise((resolve, reject) => {
      try {
        let result = normalizedAlgorithm.digest(algorithm, data)
        return resolve(result)
      } catch (error) {
        return reject(error)
      }
    })
  }

  /**
   * generateKey
   *
   * @description
   *
   * @param {AlgorithmIdentifier} algorithm
   * @param {Boolean} extractable
   * @param {Array} keyUsages
   *
   * @returns {Promise}
   */
  generateKey (algorithm, extractable, keyUsages) {
    let normalizedAlgorithm = supportedAlgorithms.normalize('generateKey', algorithm)

    if (normalizedAlgorithm instanceof Error) {
      return Promise.reject(normalizedAlgorithm)
    }

    return new Promise((resolve, reject) => {
      try {
        let result = normalizedAlgorithm.generateKey(algorithm, extractable, keyUsages)

        if (result instanceof CryptoKey) {
          let {type,usages} = result
          let restricted = (type === 'secret' || type === 'private')
          let emptyUsages = (!usages || usages.length === 0)

          if (restricted && emptyUsages) {
            throw new SyntaxError()
          }
        }

        if (result instanceof CryptoKeyPair) {
          let {privateKey:{usages}} = result

          if (!usages || usages.length === 0) {
            throw new SyntaxError()
          }
        }

        resolve(result)
      } catch (error) {
        return reject(error)
      }
    })
  }

  /**
   * deriveKey
   *
   * @description
   *
   * @param {AlgorithmIdentifier} algorithm
   * @param {CryptoKey} baseKey
   * @param {AlgorithmIdentifier} derivedKeyType
   * @param {Boolean} extractable
   * @param {Array} keyUsages
   * @returns {Promise}
   */
  deriveKey (algorithm, baseKey, derivedKeyType, extractable, keyUsages) {
    return new Promise()
  }

  /**
   * deriveBits
   *
   * @description
   *
   * @param {AlgorithmIdentifier} algorithm
   * @param {CryptoKey} baseKey
   * @param {number} length
   *
   * @returns {Promise}
   */
  deriveBits (algorithm, baseKey, length) {
    return new Promise()
  }

  /**
   * importKey
   *
   * @description
   *
   * @param {KeyFormat} format
   * @param {BufferSource|JWK} keyData
   * @param {AlgorithmIdentifier} algorithm
   * @param {Boolean} extractable
   * @param {Array} keyUsages
   *
   * @returns {Promise}
   */
  importKey (format, keyData, algorithm, extractable, keyUsages) {
    let normalizedAlgorithm = supportedAlgorithms.normalize('importKey', algorithm)

    if (normalizedAlgorithm instanceof Error) {
      return Promise.reject(normalizedAlgorithm)
    }

    return new Promise((resolve, reject) => {
      if (format === 'raw' || format === 'pkcs8' || format === 'spki') {
        if (keyData instanceof JsonWebKey) {
          throw new TypeError()
        }

        keyData = keyData.slice()
      }

      if (format === 'jwk') {
        keyData = new JsonWebKey(keyData)

        if (!(keyData instanceof JsonWebKey)) {
          throw new TypeError('key is not a JSON Web Key')
        }
      }

      try {
        let result = normalizedAlgorithm
          .importKey(format, keyData, algorithm, extractable, keyUsages)

        if (result.type === 'secret' || result.type === 'private') {
          if (!result.usages || result.usages.length === 0) {
            throw new SyntaxError()
          }
        }

        result.extractable = extractable
        result.usages = recognizedKeyUsages.normalize(keyUsages)

        resolve(result)
      } catch (error) {
        return reject(error)
      }
    })
  }

  /**
   * exportKey
   *
   * @description
   *
   * @param {KeyFormat} format
   * @param {CryptoKey} key
   *
   * @returns {Promise}
   */
  exportKey (format, key) {
    return new Promise((resolve, reject) => {
      try {
        let registeredAlgorithms = supportedAlgorithms['exportKey']

        if (!registeredAlgorithms[key.algorithm.name]) {
          throw new NotSupportedError(key.algorithm.name)
        }

        if (key.extractable === false) {
          throw new InvalidAccessError('Key is not extractable')
        }

        let result = key.algorithm.exportKey(format, key)

        resolve(result)
      } catch (error) {
        return reject(error)
      }
    })
  }

  /**
   * wrapKey
   *
   * @description
   *
   * @param {KeyFormat} format
   * @param {CryptoKey} key
   * @param {CryptoKey} wrappingKey
   * @param {AlgorithmIdentifier} wrapAlgorithm
   *
   * @returns {Promise}
   */
  wrapKey (format, key, wrappingKey, wrapAlgorithm) {
    // 1. Parameters
    // 2. Setup normalizedAlgorithm with op as 'unwrap'
    let normalizedAlgorithm = supportedAlgorithms.normalize('wrapKey', wrapAlgorithm)
    if (normalizedAlgorithm instanceof Error) {
      // 3. If failed, then try again with op as 'encrypt'
      normalizedAlgorithm = supportedAlgorithms.normalize('encrypt', wrapAlgorithm)
    }
    // 4. Otherwise reject outright
    if (normalizedAlgorithm instanceof Error)  {
      return Promise.reject(normalizedAlgorithm)
    }
    // 5-6. Setup and asynchronously return a new promise
    return new Promise((resolve, reject) => {
      // 7. Try catch the following step...
      // if anything goes wrong then reject the promise outright
      try {
          // 8. Validate normalizedAlgorithm name property
          if (normalizedAlgorithm.name !== wrappingKey.algorithm.name) {
            throw new InvalidAccessError('NormalizedAlgorthm name must be same as wrappingKey algorithm name')
          } 

          // 9. Validate usages property contains wrap
          if (!wrappingKey.usages.includes('wrapKey')) {
            throw new InvalidAccessError('Wrapping key usages must include "wrapKey"')
          }

          // 10. Validate algorithm contains exportKey
          let exportKeyAlgorithms = supportedAlgorithms['exportKey']
          if (!exportKeyAlgorithms[key.algorithm.name]) {
            throw new NotSupportedError(key.algorithm.name)
          }

          // 11. Validate extractable property
          if (key.extractable === false) {
            throw new InvalidAccessError('Key is not extractable')
          }

          // 12. Generate extracted key
          return this.exportKey(format,key)
                .then(exportedKey => { 
                  let bytes
                  // 13.1. If format is "raw", "pkcs8", or "spki":
                   if (["raw", "pkcs8","spki"].includes(format)) {
                    bytes = exportedKey
                  }
                  // 13.2. If format is "jwk"
                  else if (format === "jwk"){
                    let json = JSON.stringify(exportedKey)
                    bytes = new TextEncoder().encode(json)
                  } 
                  // 14.1. If the normalizedAlgorithm supports wrapKey then use it
                  if (normalizedAlgorithm['wrapKey']){
                    return normalizedAlgorithm.wrapKey(wrapAlgorithm,wrappingKey,new Uint8Array(bytes))
                  }
                  // 14.2. Otherwise try with encrypt
                  else if (normalizedAlgorithm['encrypt']){
                    return normalizedAlgorithm.encrypt(wrapAlgorithm,wrappingKey,new Uint8Array(bytes))
                  } 
                  // 14.3. Otherwise throw error
                  else {
                    return reject (new NotSupportedError(normalizedAlgorithm.name))
                  }
                })
                // 15. Return the resulting promise
                .then(resolve)
      } catch (error) {
        return reject(error)
      }
    })
  }

  /**
   * unwrapKey
   *
   * @description
   *
   * @param {KeyFormat} format
   * @param {BufferSource} wrappedKey
   * @param {CryptoKey} unwrappingKey
   * @param {AlgorithmIdentifier} unwrapAlgorithm
   * @param {AlgorithmIdentifier} unwrappedKeyAlgorithm
   * @param {Boolean} extractable
   * @param {Array} keyUsages
   *
   * @returns {Promise}
   */
  unwrapKey (format, wrappedKey, unwrappingKey, unwrapAlgorithm, unwrappedKeyAlgorithm, extractable, keyUsages) {
    // 1. Parameters
    // 2. ?
    
    // 3. Setup normalizedAlgorithm with op as 'unwrap'
    let normalizedAlgorithm = supportedAlgorithms.normalize('unwrapKey', unwrapAlgorithm)
    if (normalizedAlgorithm instanceof Error) {
    // 4. If failed, then try again with op as 'encrypt'
      normalizedAlgorithm = supportedAlgorithms.normalize('decrypt', unwrapAlgorithm)
    }

    // 5. Otherwise reject outright
    if (normalizedAlgorithm instanceof Error)  {
      return Promise.reject(normalizedAlgorithm)
    }

    // 6. Setup normalizedKeyAlgorithm
    let normalizedKeyAlgorithm = supportedAlgorithms.normalize('importKey', unwrapAlgorithm)
    if (normalizedKeyAlgorithm instanceof Error) {
    // 7. If failed, then try again with op as 'encrypt'
      return Promise.reject(normalizedKeyAlgorithm)
    }

    // 8-9. Setup and asynchronously return a new promise
    return new Promise((resolve, reject) => {
      // 10. Try catch the following step...
      // if anything goes wrong then reject the promise outright
      try {
          // 11. Validate normalizedAlgorithm name property
          if (normalizedAlgorithm.name !== unwrappingKey.algorithm.name) {
            throw new InvalidAccessError('NormalizedAlgorthm name must be same as unwrappingKey algorithm name')
          } 

          // 12. Validate usages property contains unwrap
          if (!unwrappingKey.usages.includes('unwrapKey')) {
            throw new InvalidAccessError('Unwrapping key usages must include "unwrapKey"')
          }
          
          let keyPromise
          // 13.1. If the normalizedAlgorithm supports unwrapKey then use it
          if (normalizedAlgorithm['unwrapKey']){
            keyPromise = this.unwrapKey(unwrapAlgorithm,unwrappingKey,wrappedKey)
          }

          // 13.2. Otherwise try with decrypt
          else if (normalizedAlgorithm['decrypt']){
            keyPromise = this.decrypt(unwrapAlgorithm,unwrappingKey,wrappedKey)
          } 

          // 13.3. Otherwise throw error
          else {
            return reject (new NotSupportedError(normalizedAlgorithm.name))
          }

          return keyPromise.then( key => {
            let bytes
            // 14.1. If format is "raw", "pkcs8", or "spki":
              if (["raw", "pkcs8","spki"].includes(format)) {
              bytes = key
            }

            // 14.2. If format is "jwk"
            else if (format === "jwk"){
              bytes = JSON.parse(new TextDecoder().decode(key))
              console.log("bytes",bytes)
            } 

            // 15. Import the resulting unwrapped content
            //  importKey (format, keyData, algorithm, extractable, keyUsages)
            return normalizedKeyAlgorithm.importKey(format,
                                            bytes,
                                            unwrappedKeyAlgorithm,
                                            extractable,
                                            keyUsages)
          }).then(result => {
            // 16. Validate type parameters and usage length
            if ((result.type === "secret" || result.type === "private") && result.usages.length === 0){
              throw new SyntaxError("Usages cannot be empty")
            }

            // 17. Set extractable
            result.extractable = extractable

            // 18. Set usages
            result.usages = keyUsages

            // 19. Resolve promise
            return resolve(result)
          }).catch(console.log)
      } catch (error) {
        return reject(error)
      }
    })
  }
}

/**
 * Export
 */
module.exports = SubtleCrypto

// const AES_GCM = require('./algorithms/AES-GCM')

// aes = new AES_GCM({ name: "AES-GCM", length: 256 })
// key = aes.importKey(
//     "jwk",
//     {
//         kty: "oct",
//         k: "Y0zt37HgOx-BY7SQjYVmrqhPkO44Ii2Jcb9yydUDPfE",
//         alg: "A256GCM",
//         ext: true,
//     },
//     {
//         name: "AES-GCM",
//     },
//     true,
//     ["encrypt", "decrypt","wrapKey","unwrapKey"]
// )
// let SC = new SubtleCrypto()

// let x = SC.wrapKey('jwk',key,key,{name:"AES-GCM",iv: new Uint8Array([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15])})
// x.then(result => console.log("is this working?",JSON.stringify(Array.from(new Uint8Array(result))),new Uint8Array(result).length))

// let wc = new Uint8Array([
//   161, 111, 8, 29, 75, 53, 230, 127, 59, 123, 74, 164, 212, 248, 8, 
//   118, 77, 163, 181, 229, 178, 102, 47, 241, 15, 21, 165, 199, 188, 
//   70, 180, 186, 130, 108, 22, 194, 178, 189, 218, 129, 99, 220, 189, 
//   173, 65, 196, 48, 254, 194, 241, 242, 76, 26, 125, 53, 110, 200, 
//   129, 229, 237, 142, 222, 49, 159, 156, 88, 8, 7, 124, 186, 207, 42, 
//   236, 235, 65, 210, 182, 85, 91, 37, 84, 102, 49, 40, 156, 132, 128, 
//   181, 198, 118, 104, 191, 21, 124, 54, 45, 122, 238, 195, 207,
//   112, 241, 214, 194, 112, 112, 89, 246, 223, 170, 149, 175, 128, 240,
//   184, 64, 134, 230, 203, 23, 48, 55, 94, 57, 102, 249, 11, 254,
//   163, 199, 68, 122, 112, 46, 14, 239, 198, 173, 58, 86, 251, 222, 217,
//   108, 233, 161, 227, 112
// ])


// SC.unwrapKey(
//   'jwk',
//   wc,
//   key,
//   {
//     name:"AES-GCM",
//     iv: new Uint8Array([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]),
//     tagLength: 128
//   },
//   {   
//       name: "AES-GCM",
//       length: 256
//   },
//   true,
//   ["encrypt","decrypt","unwrapKey"]
// ).then(key => SC.exportKey("jwk",key) ).then(console.log).catch(console.error)

