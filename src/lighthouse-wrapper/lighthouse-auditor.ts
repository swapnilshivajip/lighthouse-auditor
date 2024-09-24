import * as ChromeLauncher from 'chrome-launcher';
import lighthouse, { Config, Flags, RunnerResult } from "lighthouse";
import fs, { readFileSync } from 'fs';
import { logger } from '../util/logger.js';
import * as path from 'path';
import { validateDirectoryPath } from '../util/files.js';
import { getRandomUUID } from '../util/random.js';
import { getFormFactor, getOutputTypes, getAuditCategories, getLogLevel, getHeadless, getDisableGPU } from './lighthouse-config.js';
import { getLogger } from 'log4js';
import desktopConfig from 'lighthouse/core/config/lr-desktop-config.js';
import mobileConfig from 'lighthouse/core/config/lr-mobile-config.js';


let reportLocation: string = "./reports";
let chrome: ChromeLauncher.LaunchedChrome;


export interface Cookie {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: string;
    storeId?: string;
    hostOnly?: string;
}

export interface SessionData {
    cookies: Cookie[];
    // sessionStorage : TBD
    // localStorage : TBD
}

/**
 * Input paramter data type for 'runAudit' method.
 */
export interface AuditOptions {
    chromeOptions?: ChromeFlagsConfig | {};
    sessionData?: SessionData;
    lighthouseFlags?: Flags;
}

/**
 * Chrome flags configurations.
 */
export interface ChromeFlagsConfig {
    chromeFlags?: {
        headless?: boolean;
        'disable-gpu'?: boolean;
        [key: string]: boolean | undefined; // Allow other flags as well
    };
    logLevel?: 'verbose' | 'info' | 'error' | 'warn' | 'silent';
}

/**
 * Clean up existing reports.
 */
function cleanUpReports() {
    if (fs.existsSync(reportLocation)) {
        fs.readdirSync(reportLocation).forEach(file => {
            const filePath = path.join(reportLocation, file);
            if (file.startsWith('performance-report-thread-') && file.endsWith('.html')) {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    logger.debug(`Deleted old HTML report: ${filePath}`);
                }
            }
            if (file.startsWith('performance-report-thread-') && file.endsWith('.json') && file.includes('trace')) {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    logger.debug(`Deleted old Traces report: ${filePath}`);
                }
            }
            if (file.startsWith('performance-report-thread-') && file.endsWith('.json')) {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    logger.debug(`Deleted old JSON report: ${filePath}`);
                }
            }
        });
    }
}

/**
 * Prepate chrome flags and log level from ChromeFlagsConfig type object.
 */
function getChromeLaunchOptions(chromeOpt?: ChromeFlagsConfig): ChromeLauncher.Options {
    logger.debug(`Programmatic Chrome Options: ${chromeOpt}`);
    chromeOpt = chromeOpt ? chromeOpt : {};
    chromeOpt.chromeFlags = chromeOpt?.chromeFlags ? chromeOpt.chromeFlags : {};
    chromeOpt.chromeFlags.headless = chromeOpt.chromeFlags?.headless ?? (getHeadless() ?? true);
    chromeOpt.chromeFlags['disable-gpu'] = chromeOpt.chromeFlags?.['disable-gpu'] ?? (getDisableGPU() ?? true);
    logger.debug(`Updated chrome flags : ${JSON.stringify(chromeOpt.chromeFlags)}`);
    // Convert the flags from the JSON object to the array format required by chrome-launcher
    const chromeFlags: string[] = [];
    if (chromeOpt.chromeFlags) {
        for (const [key, value] of Object.entries(chromeOpt.chromeFlags)) {
            if (value === true) {
                chromeFlags.push(`--${key}`);
            }
        }
    }
    chromeFlags.push("--disable-storage-reset");

    let chromeOptions:ChromeLauncher.Options = {
        chromeFlags,
        logLevel: chromeOpt.logLevel ? chromeOpt.logLevel : (getLogLevel() ? getLogLevel() : 'info'),
    }

    logger.info(`Prepared Chrome options: ${JSON.stringify(chromeOptions)}`);
    logger.debug(`Chrome user defined flags: ${chromeOptions.chromeFlags}`);
    logger.debug(`Chrome log level set to: ${chromeOptions.logLevel}`);

    return chromeOptions;
}

/**
 * Launch chrome for given url.
 * @param url url of webpage/website
 */
async function launchChrome(url?: string, chromeOptions?: ChromeFlagsConfig) {

    // launch chrome
    logger.info(`Launching chrome...`);
    //** take user input as config file value or programmatically, if absent then provide default config
    chrome = await ChromeLauncher.launch(
        getChromeLaunchOptions(chromeOptions)
    );
    logger.info(`Chrome launched on port ${chrome.port}`);
    logger.info(`Chrome default flags: ${ChromeLauncher.Launcher.defaultFlags()}`);

    return chrome;
}

/**
 * Set directory path to store the generated lighthouse report.
 * @param location absolute directory path
 */
export function setReportLocation(location: string) {
    if (location) {
        if (!validateDirectoryPath(location)) {
            throw new Error(`Invalid directory path: ${location}`);
        }
    }
    reportLocation = location;
}

/**
 * Get lighthouse flags from json properties else prepare default config.
 * @param browser 
 * @param lighthouseFlags 
 * @returns 
 */
function getLighthouseFlags(browser: ChromeLauncher.LaunchedChrome, lighthouseFlags: Flags|undefined, cookies?:Cookie[]) {
    lighthouseFlags = lighthouseFlags ? lighthouseFlags : {};
    lighthouseFlags.logLevel = lighthouseFlags.logLevel ? lighthouseFlags.logLevel : (getLogLevel() ? getLogLevel() : 'info');
    lighthouseFlags.output = lighthouseFlags.output ? lighthouseFlags.output : (getOutputTypes() ? getOutputTypes() : ['html']);
    lighthouseFlags.onlyCategories = lighthouseFlags.onlyCategories ? lighthouseFlags.onlyCategories : (getAuditCategories() ? getAuditCategories() : ['performance']);
    lighthouseFlags.formFactor = lighthouseFlags.formFactor ? lighthouseFlags.formFactor : (getFormFactor() ? getFormFactor() : "desktop");
    lighthouseFlags.port = browser.port;
    lighthouseFlags.extraHeaders = lighthouseFlags.extraHeaders ? lighthouseFlags.extraHeaders : {};
    lighthouseFlags.extraHeaders['Cookie'] = lighthouseFlags.extraHeaders['Cookie'] ? lighthouseFlags.extraHeaders['Cookie'] : (cookies ? cookies?.map(cookie => `${cookie.name}=${cookie.value}`).join('; '):'');
    lighthouseFlags.disableStorageReset = true;
    logger.info(`Lighthouse Config: ${JSON.stringify(lighthouseFlags)}`);
    return lighthouseFlags;
}

/**
 * Get lighthouse config based on 'formFactor' attribute from json.
 * @returns 
 */
function getLighthouseConfig(): Config {
    if (getFormFactor() == "desktop") {
        //** enhance to return desktop-config.js or lr-desktop-config.js based on headless flag
        let temp:Config = {
            extends: 'lighthouse:default',
            settings: {
              formFactor: 'desktop',
              screenEmulation: {
                mobile: false,
                width: 1350,
                height: 940,
                deviceScaleFactor: 1,
                disabled: false,
              },
              throttling: {
                rttMs: 40,
                throughputKbps: 10240,
                cpuSlowdownMultiplier: 1,
                requestLatencyMs: 0,
                downloadThroughputKbps: 0,
                uploadThroughputKbps: 0,
              },
              emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4143.7 Safari/537.36 Chrome-Lighthouse',
            },
          };
          
        
        return temp;
    } else {
        return mobileConfig;
    }
}

/**
 *  Run lighthouse audit on the given URL and generate report. This will delete any existing reports.
 * @param url 
 * @param auditOpts 
 */
export async function runAudit(url: string, auditOpts?: AuditOptions): Promise<void> {

    // clean up existing reports.
    cleanUpReports();

    // launch chrome
    const threadId = getRandomUUID();
    logger.info(`Running audit over thread: ${threadId}.`)
    chrome = await launchChrome(url, auditOpts?.chromeOptions);

    // set up lighthouse configuration
    let flags: Flags = getLighthouseFlags(chrome, auditOpts?.lighthouseFlags, auditOpts?.sessionData?.cookies);
    let configuration: Config = getLighthouseConfig();
    logger.info(`Lighthouse config after cookie updation: ${JSON.stringify(configuration)}`);

    try {
        logger.info(`Running lighthouse...`)
        const runnerResult: RunnerResult | undefined = await lighthouse(url, flags, configuration);
        logger.info(`Lighthouse processing completed.`)
        // Generate reports
        generateReports(runnerResult, threadId, flags);
    } catch (error) {
        logger.error(`Error in thread: ${threadId}`)
        logger.error(error);
    } finally {
        logger.info(`Killing the chrome instance.`)
        chrome.kill();
        logger.info(`Chrome instance killed successfully.`)
    }
}

/**
 * Generate Reports.
 * @param runnerResult 
 * @param threadId 
 * @param flags 
 */
function generateReports(runnerResult: RunnerResult | undefined, threadId: any, flags: Flags) {

    // Create 'reports' folder at root path if not present
    if (reportLocation == "./reports") {
        if (!fs.existsSync(reportLocation)) {
            fs.mkdirSync(reportLocation);
        }
    } else {
        if (!fs.existsSync(reportLocation)) {
            throw new Error(`'${reportLocation}' does not exist.`)
        }
    }

    // Generate HTML Report
    if (flags.output?.includes('html')) {
        // `.report` is the HTML report as a string or string[]
        let reportHtml = runnerResult?.report[0];
        // Ensure reportHtml is defined and handle string[] case
        if (reportHtml) {
            logger.info(`Generating HTML report.`)
            if (Array.isArray(reportHtml)) {
                reportHtml = reportHtml.join('');
            }
            // Write the report to an HTML file
            const reportFileName = `performance-report-thread-${threadId}-${Date.now()}.html`;
            const reportFilePath = path.join(
                reportLocation, reportFileName);
            fs.writeFileSync(reportFilePath, reportHtml);
            logger.info(`HTML Report generation successful.`)
        } else {
            logger.error("Report HTML is undefined. Failed to generate report.");
        }
    }

    // Generate JSON Report
    if (flags.output?.includes('json')) {
        // `.report` is the HTML report as a string or string[]
        let reportJson = runnerResult?.report[1];
        // Ensure reportJson is defined and handle string[] case
        if (reportJson) {
            logger.info(`Generating JSON report.`)
            if (Array.isArray(reportJson)) {
                reportJson = reportJson.join('');
            }
            // Write the report to an HTML file
            const reportFileName = `performance-report-thread-${threadId}-${Date.now()}.json`;
            const reportFilePath = path.join(
                reportLocation, reportFileName);
            fs.writeFileSync(reportFilePath, reportJson);
            logger.info(`JSON Report generation successful.`)
        } else {
            logger.error("Report JSON is undefined. Failed to generate report.");
        }
    }

    // Generate traces
    if (runnerResult?.artifacts) {
        logger.info(`Generating Trace JSON report.`)
        // Write the traces to json file
        const traceFileName = `performance-report-thread-${threadId}-${Date.now()}-traces.json`;
        const reportFilePath = path.join(
            reportLocation, traceFileName);
        fs.writeFileSync(reportFilePath, JSON.stringify(runnerResult.artifacts.traces.defaultPass, null, 2));
        logger.info(`Trace JSON Report generation successful.`)
    } else {
        logger.error("Failed to generate traces.");
    }
}





