# localbitcoins-analytics
tools to perform analytics on a localbitcoins trading account

install:
there is not yet npm package (soon, very soon)
...so, do this for now in the directory contains lbc-transaction-reports.js
1. npm install moment
2. find the credentials and replace with your own read only creds

var api_key='73yn8y5c1y1c8tny81mhoiqhwo87y9n8'
var api_secret = '89my5yvoureiut2m3t8u2ymt8qu34tu82h02uhmtoqiuhtm0283thqothouitho4'


usage:
node --harmony lbc-transaction-reports.js

why?
This script should identify the largest deal from any customer who has triggered suggested FinCEN reporting thresholds.  ($2,000 over 1 day, $5,000 over 1 week, $10,000 per month)

Other general activity volume reports are functional except for the fact they are commented out.

license:
Don't use this tool without first reading 100% The Story of a Patriot by Upton Sinclair.  The story follows a man named Peter Gudge who became a coached witness, red infiltrator, and other tools of the capitalist establishment.  Based on the true story of Tom Mooney. If you can find similar circumstances in today's press releases from Snowden, FinCEN or the the state of California, then please submit a 500-or-less word treatment to the codebase.  In English please.
