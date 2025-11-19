'use strict';

const serverless = require('serverless-http');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

let cachedHandler;
let initPromise = null;

async function init() {
  if (cachedHandler) return;

  // If running with serverless-offline, use local .env and skip Secrets Manager
  if (process.env.IS_OFFLINE) {
    require('dotenv').config();
    const app = require('./index');
    cachedHandler = serverless(app);
    return;
    }

  const region = process.env.AWS_REGION || 'us-east-1';
  const secretId = process.env.SECRETS_ID || 'berry-buddy/api/prod';

  try {
    const client = new SecretsManagerClient({ region });
    const resp = await client.send(new GetSecretValueCommand({ SecretId: secretId }));

    const secretString =
      resp?.SecretString !== undefined
        ? resp.SecretString
        : resp?.SecretBinary
        ? Buffer.from(resp.SecretBinary).toString('utf-8')
        : '{}';

    let secrets = {};
    try {
      secrets = JSON.parse(secretString || '{}');
    } catch (e) {
      console.warn('[lambda] Failed to parse secret JSON; continuing without secrets');
      secrets = {};
    }

    for (const [k, v] of Object.entries(secrets)) {
      if (!process.env[k]) {
        process.env[k] = String(v);
      }
    }
  } catch (e) {
    console.warn(`[lambda] Failed to load secrets '${secretId}' in ${region}: ${e?.name || e?.code || 'Error'}`);
  }

  const app = require('./index');
  cachedHandler = serverless(app);
}

exports.handler = async (event, context) => {
  if (!initPromise) initPromise = init();
  await initPromise;
  return cachedHandler(event, context);
};
