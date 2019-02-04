// Arguments passed into this controller can be accessed via the `$.args` object
// directly or:
const {args} = $, CryptoJS = require('/pbkdf2');
(function constructor(CryptoJS) {

  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  console.debug('salt', salt.toString());
  const key128Bits = CryptoJS.PBKDF2("Secret Passphrase", salt, {keySize : 128 / 32});
  console.debug('key128Bits', key128Bits.toString());
  const key256Bits = CryptoJS.PBKDF2("Secret Passphrase", salt, {keySize : 256 / 32});
  console.debug('key256Bits', key256Bits.toString());
  const key512Bits = CryptoJS.PBKDF2("Secret Passphrase", salt, {keySize : 512 / 32});
  console.debug('key512Bits', key512Bits.toString());
  const key512Bits1000Iterations =
      CryptoJS.PBKDF2("Secret Passphrase", salt, {keySize : 512 / 32, iterations : 30000});
  console.debug('key512Bits1000Iterations', key512Bits1000Iterations.toString());
  $.trigger('initialisation:ready');
})(CryptoJS);
function alert(message) {
  console.log(message);
}
exports.alert = alert;
