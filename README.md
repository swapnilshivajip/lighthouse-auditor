Read Me yet to complete.


Reference Links:

https://www.npmjs.com/package/chrome-launcher

https://www.npmjs.com/package/lighthouse?activeTab=readme

https://github.com/GoogleChrome/lighthouse/blob/HEAD/docs/readme.md#using-programmatically

https://akanksha98.medium.com/lighthouse-integration-with-docker-b8d9fddedce6

https://github.com/akagupta9/lighthouse-wrapper

https://medium.com/testvagrant/automate-lighthouse-2822b12f3465

https://github.com/GoogleChrome/lighthouse/blob/main/docs/readme.md

https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md

https://www.debugbear.com/blog/network-throttling-methods

https://www.debugbear.com/blog/simulated-throttling

https://www.debugbear.com/blog/render-blocking-resources

https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md

### System requirements to tackle variance in the result [reference](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md#strategies-for-dealing-with-variance):
- Minimum 2 dedicated cores (4 recommended)
- Minimum 2GB RAM (4-8GB recommended)
- Avoid non-standard Chromium flags (--single-process is not supported, --no-sandbox and --headless should be OK, though educate yourself about sandbox tradeoffs)
- Avoid function-as-a-service infrastructure (Lambda, GCF, etc)
- Avoid "burstable" or "shared-core" instance types (AWS t instances, GCP shared-core N1 and E2 instances, etc)

AWS's m5.large, GCP's n2-standard-2, and Azure's D2 all should be sufficient to run a single Lighthouse run at a time.
DO NOT collect multiple Lighthouse reports at the same time on the same machine. 