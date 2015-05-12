# localbitcoins-analytics

localbitcoins-analytics is a set of utilities to help dealers on localbitcoins.  
  - Developed by dealers for dealers.
  - Requires a set of read only credentials from localbitcoins

### Version
1.0.0

### Tech

Dillinger uses a number of open source projects to work properly:

* [node.js] - evented I/O for the backend
* [localbitcoins.com] - https://localbitcoins.com/api-docs/


### Installation

```sh

$ git clone https://github.com/pullfinger/localbitcoins-analytics.git

$ cd localbitcoins-analytics

$ npm install


### usage
node --harmony lbc-transaction-reports.js

### why on earth?
This script should identify the largest deal from any customer who has triggered suggested FinCEN reporting thresholds.  ($2,000 over 1 day, $5,000 over 1 week, $10,000 per month)

Other general activity volume reports are functional except for the fact they are commented out.

### license:
Don't use this tool without first reading 100% The Story of a Patriot by Upton Sinclair.  The story follows a man named Peter Gudge who became a coached witness, red infiltrator, and other tools of the capitalist establishment.  Based on the true story of Tom Mooney. If you can find similar circumstances in today's press releases from Snowden, FinCEN or the the state of California, then please submit a 500-or-less word treatment to the codebase.  In English please.


[cole albon]:http://blockchain.army
[node.js]:http://nodejs.org
[dillinger.io]:http://dillinger.io
[localbitcoins]:http://localbitcoins.com/api-docs
