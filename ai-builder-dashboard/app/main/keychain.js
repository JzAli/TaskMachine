const keytar = require('keytar');

const SERVICE_NAME = 'ai-builder-dashboard';

async function saveCredential(account, secret) {
  if (!secret) {
    return deleteCredential(account);
  }
  await keytar.setPassword(SERVICE_NAME, account, secret);
  return true;
}

async function getCredential(account) {
  return keytar.getPassword(SERVICE_NAME, account);
}

async function deleteCredential(account) {
  await keytar.deletePassword(SERVICE_NAME, account);
  return true;
}

module.exports = {
  saveCredential,
  getCredential,
  deleteCredential,
};
