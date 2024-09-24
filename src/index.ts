import * as ChromeLauncher from 'chrome-launcher';
import { logger } from './util/logger.js';
import * as LighthouseAuditor from './lighthouse-wrapper/lighthouse-auditor.js';
import { readFileSync } from 'fs';
import { getURL } from './lighthouse-wrapper/lighthouse-config.js';


const launchNkillChrome = async () => {
    logger.info(`Running sanity for chrome-launcher by launching and killing chrome...`)
    let chrome:ChromeLauncher.LaunchedChrome = await ChromeLauncher.launch({
        startingUrl: 'https://google.com'
      });

    logger.info(`Chrome launched on port ${chrome.port}`)
    chrome.kill();
    logger.info(`Chrome killed`);
}

const cookies: LighthouseAuditor.Cookie[] = JSON.parse(readFileSync('./configs/cookies.json', 'utf-8'));
await LighthouseAuditor.runAudit(getURL(),{sessionData:{cookies:cookies}});
//,{chromeOptions:{chromeFlags:{headless:false,"disable-gpu":false}},lighthouseFlags:{onlyCategories:['performance','seo']}}