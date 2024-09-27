import * as ChromeLauncher from 'chrome-launcher';
import { logger } from './util/logger.js';
import * as LighthouseAuditor from './lighthouse-wrapper/lighthouse-auditor.js';
import { readFileSync } from 'fs';
import { getURL } from './lighthouse-wrapper/lighthouse-config.js';
import { readJsonFile } from './util/files.js';
import { Cookie } from 'playwright-core';

const cookies: Cookie[] = JSON.parse(readFileSync('./configs/cookies.json', 'utf-8'));
const runs = readJsonFile("./lighthouse-config.json")["runs"];
await LighthouseAuditor.runAudit(getURL(),{sessionData:{cookies:cookies}},runs);