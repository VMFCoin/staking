#!/usr/bin/env node
// Fetch verified contract source JSON from BaseScan (Etherscan-compatible) and write Solidity files locally.
// Requires env var BASESCAN_API_KEY.

import { writeFile, mkdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import https from 'https';
import path from 'path';

const API_KEY = process.env.BASESCAN_API_KEY;
if (!API_KEY) {
  console.error('Missing BASESCAN_API_KEY in environment');
  process.exit(1);
}

// Addresses (Base Sepolia)
const contracts = [
  { address: '0xCCC28c4E7204C44676CFDEbf8172599404c4610A', name: 'VMFStaking' },
  { address: '0x7A97a79DD86a9AC7636a023C2A87393FB89a0918', name: 'VMFToken' },
];

const outRoot = path.resolve('contracts');

async function ensureDir(dir) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, data }));
      })
      .on('error', reject);
  });
}

function tryParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (_) {
    return null;
  }
}

async function processContract({ address, name }) {
  console.log(`\nFetching source for ${name} @ ${address}`);
  // Using unified Etherscan V2 multichain endpoint (Base Sepolia chainid=84532)
  const url = `https://api.etherscan.io/v2/api?chainid=84532&module=contract&action=getsourcecode&address=${address}&apikey=${API_KEY}`;
  const { status, data } = await httpsGet(url);
  if (status !== 200) throw new Error(`HTTP ${status} for ${address}`);
  let json;
  try {
    json = JSON.parse(data);
  } catch (e) {
    throw new Error('Failed to parse API response JSON');
  }
  if (!json.result || !json.result.length) throw new Error('Empty result array');
  const entry = json.result[0];
  const sourceRaw = entry.SourceCode || '';
  const abiRaw = entry.ABI || '[]';

  // Write ABI
  await ensureDir(outRoot);
  await writeFile(path.join(outRoot, `${name}.abi.json`), abiRaw);

  // Attempt to parse SourceCode as JSON Standard Input
  let sourceJSON = sourceRaw.trim();
  // Some explorers wrap the standard JSON in additional braces or quotes; clean common patterns.
  if (sourceJSON.startsWith('{{')) {
    // Remove one layer of braces if double-wrapped
    sourceJSON = sourceJSON.slice(1, -1);
  }
  const parsed = tryParseJSON(sourceJSON);
  if (parsed && parsed.sources) {
    console.log(`Parsed multi-file Standard JSON with ${Object.keys(parsed.sources).length} sources.`);
    for (const [filePath, fileObj] of Object.entries(parsed.sources)) {
      const relPath = path.join(outRoot, filePath.replace(/^\./, '')); // avoid leading ./
      await ensureDir(path.dirname(relPath));
      await writeFile(relPath, fileObj.content);
    }
    // Also persist compiler settings for reproducibility
    if (parsed.settings) {
      await writeFile(path.join(outRoot, `${name}.compiler-settings.json`), JSON.stringify(parsed.settings, null, 2));
    }
  } else {
    // Fallback: single-file source
    const singlePath = path.join(outRoot, `${name}.sol`);
    await writeFile(singlePath, sourceRaw);
    console.log('Wrote single source file (could not parse Standard JSON structure).');
  }
  console.log(`Done: ${name}`);
}

async function main() {
  for (const c of contracts) {
    try {
      await processContract(c);
    } catch (e) {
      console.error(`Error processing ${c.name}:`, e.message);
    }
  }
  console.log('\nAll fetches complete.');
}

main();
