var co = require('co')
var request = require('co-request')
var nonce = require('nonce') ();
var crypto = require("crypto");
var thepayload = new Array();
var moment = require('moment');

function round(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function getAssetMeta ( asset_symbol ) {
    assetMeta = {}
    switch(asset_symbol) {
        case 'USD':
            assetMeta.symbol = 'USD'
            assetMeta.label = 'US Dollar'
            assetMeta.label_plural = 'US Dollars'
            assetMeta.atom_label = 'penny'
            assetMeta.atom_label_plural = 'pennies'
            assetMeta.atoms_per_unit = parseInt(100)
            break
        case 'BTC':
            assetMeta.symbol = 'BTC'
            assetMeta.label = 'bitcoin'
            assetMeta.label_plural = 'bitcoins'
            assetMeta.atom_label = 'satoshi'
            assetMeta.atom_label_plural = 'satoshis'
            assetMeta.atoms_per_unit = parseInt(100000000)
            break
    }
    return assetMeta
}

function reportVolumeTimeslice ( transaction_list, time_format_string ) {
    var result = [].concat.apply(
        [], transaction_list.map(function(transaction) {
            txn = {}
            txn.timeslice = time_format_string
            txn.released_at_timeslice = moment.utc(transaction.released_at_utc).format(time_format_string)
            txn.asset_in = transaction.asset_in
            txn.number_in = transaction.number_in
            txn.asset_out = transaction.asset_out
            txn.number_out = transaction.number_out
            txn.timeslice_asset_in_asset_out = moment.utc(transaction.released_at_utc).format(time_format_string) + transaction.asset_in.toString() + transaction.asset_out.toString()
            return txn
        })
        .reduce(function(res, obj) {
            if(!(obj.timeslice_asset_in_asset_out in res))
                res.__array.push(res[obj.timeslice_asset_in_asset_out] = obj)
            else {
                res[obj.timeslice_asset_in_asset_out].timeslice = obj.timeslice
                res[obj.timeslice_asset_in_asset_out].asset_in = obj.asset_in
                res[obj.timeslice_asset_in_asset_out].number_in += obj.number_in
                res[obj.timeslice_asset_in_asset_out].asset_out = obj.asset_out
                res[obj.timeslice_asset_in_asset_out].number_out += obj.number_out
            res[obj.timeslice_asset_in_asset_out].timeslice_asset_in_asset_out = obj.timeslice_asset_in_asset_out
            }
            return res
        }, {__array:[]} ).__array
        .map(function(timeslice_summary){
            var timeslice_smry = {}
            timeslice_smry.timeslice_label = timeslice_summary.timeslice
            timeslice_smry.released_at_timeslice = timeslice_summary.released_at_timeslice
            timeslice_smry.asset_in_label_plural = getAssetMeta(timeslice_summary.asset_in).label_plural
            timeslice_smry.amount_in_display = round(parseFloat(
                timeslice_summary.number_in / getAssetMeta(timeslice_summary.asset_in).atoms_per_unit)
                , 2)
            timeslice_smry.asset_out_label_plural = getAssetMeta(timeslice_summary.asset_out).label_plural
            timeslice_smry.amount_out_display = round(parseFloat(
                timeslice_summary.number_out / getAssetMeta(timeslice_summary.asset_out).atoms_per_unit)
                , 2)

            return timeslice_smry
        })
    )
    return result
}

function reportVolumeUser ( transaction_list ) {
    var result = [].concat.apply(
        [], transaction_list.map(function(transaction) {
            txn = {}
            txn.asset_in = transaction.asset_in
            txn.number_in = transaction.number_in
            txn.asset_out = transaction.asset_out
            txn.number_out = transaction.number_out
            txn.released_at = moment.utc(transaction.released_at_utc)
            txn.buyer = transaction.buyer
            txn.txn_count = 1
            return txn
        })
        .reduce(function(res, obj) {
            if(!(obj.buyer in res))
                res.__array.push(res[obj.buyer] = obj)
            else {
                res[obj.buyer].buyer= obj.buyer
                res[obj.buyer].asset_in = obj.asset_in
                res[obj.buyer].number_in += obj.number_in
                res[obj.buyer].asset_out = obj.asset_out
                res[obj.buyer].number_out += obj.number_out
                res[obj.buyer].txn_count += obj.txn_count
                res[obj.buyer].buyer = obj.buyer
            }
            return res
        }, {__array:[]} ).__array
        .map(function(user_summary){
            var user_smry = {}
            user_smry.buyer = user_summary.buyer
            user_smry.asset_in_label_plural = getAssetMeta(user_summary.asset_in).label_plural
            user_smry.amount_in_display = round(parseFloat(
                user_summary.number_in / getAssetMeta(user_summary.asset_in).atoms_per_unit)
                , 2)
            user_smry.asset_out_label_plural = getAssetMeta(user_summary.asset_out).label_plural
            user_smry.amount_out_display = round(parseFloat(
                user_summary.number_out / getAssetMeta(user_summary.asset_out).atoms_per_unit)
                , 2)
            return user_smry
        })        
        .filter(function(user_summary) {
            return user_summary.amount_in_display > 2000
        })
    )
    return result
}

function reportSuspiciousActivity ( time_period_days, pennies_amt, transaction_list ) {
    var result = [].concat.apply(
        [], transaction_list.map(function(transaction) {
            txn = {}
            txn.asset_in = transaction.asset_in
            txn.number_in = transaction.number_in
            txn.asset_out = transaction.asset_out
            txn.number_out = transaction.number_out
            txn.released_at = moment.utc(transaction.released_at_utc)
            txn.buyer = transaction.buyer
            txn.txn_count = 0
            return txn
        })
        .sort(function(a,b) { return a.released_at - b.released_at })
        .reduce(function(buyers, txn) {
            txn.buyerindex = txn.buyer
            
            if (!(txn.buyerindex in buyers)){
                txn.previous_released_at = txn.released_at
                txn.previous_structuresize = 0
                buyers.__array.push(buyers[txn.buyerindex] = txn)
                buyers[txn.buyerindex].maxstructuresize = 0
            }
            else
            {
                txn.previous_released_at = buyers[txn.buyerindex].released_at
                txn.previous_structuresize = buyers[txn.buyerindex].structuresize
            }
            buyers[txn.buyerindex].released_at = txn.released_at
            buyers[txn.buyerindex].previous_released_at = txn.previous_released_at
            buyers[txn.buyerindex].previous_structuresize = txn.previous_structuresize
            buyers[txn.buyerindex].days_since = moment.duration(txn.released_at.diff(txn.previous_released_at)).asDays()
            if(moment.duration(txn.released_at.diff(txn.previous_released_at)).asDays() < time_period_days )
            {
                buyers[txn.buyerindex].structuresize = txn.previous_structuresize + txn.number_in
            }
            else {
                buyers[txn.buyerindex].structuresize = txn.number_in
            }
            
            if(buyers[txn.buyerindex].structuresize > buyers[txn.buyerindex].maxstructuresize) {
                buyers[txn.buyerindex].maxstructuresize = buyers[txn.buyerindex].structuresize
                buyers[txn.buyerindex].maxstructureenddate = txn.released_at
            }

         return buyers
    }, {__array:[]} ).__array)
        .filter(function(user_summary) {
             return user_summary.maxstructuresize > pennies_amt
        })
    return result
}


function reportTransactionList ( transactions_json )
{
    // navigate to transaction level
    var result = [].concat.apply(
        [], transactions_json.map(
            function(dlpage){
                return dlpage.data['contact_list'].map(
                    function(contact_list){
                        return contact_list.data
                    })
            })
    )
    // row level business logic
    .map(function(transaction){
        var txn = {}
        txn.released_at_utc = moment(transaction.released_at).valueOf()
        txn.asset_in = getAssetMeta(transaction.currency).symbol
        txn.number_in = parseInt(parseFloat(transaction.amount) * getAssetMeta(transaction.currency).atoms_per_unit)
        txn.asset_out = getAssetMeta('BTC').symbol
        txn.number_out = parseInt(parseFloat(transaction.amount_btc) * getAssetMeta('BTC').atoms_per_unit)
        txn.buyer = transaction.buyer.username
        return txn
    })
    return result
}

function* generateHmac (message, secretkey, algorithm, encoding) {
    return crypto.createHmac(algorithm, secretkey).update(message).digest(encoding)
}

function* buildHmacMessage (the_nonce, api_key, pathname, query) {
    query = query || ''
    var message = the_nonce + api_key + pathname + query
    return message
}

function* buildOptions ( api_key, the_nonce, target_url, api_secret, algorithm, encoding) {
    var url = require("url");
    var urlobj = url.parse(target_url)
    var pathname = urlobj.pathname
    var query = urlobj.query
    return {
        url: target_url,
        "headers": {
            "Apiauth-Key": api_key,
            "Apiauth-Nonce": the_nonce,
            "Apiauth-Signature": yield generateHmac ( yield buildHmacMessage(the_nonce, api_key, pathname, query), api_secret, algorithm, encoding)
            },
        "form": {
        }
    }
}

// download paginated transactions from localbitcoins.com
co(function* () {  //author doesn't know if "co" non-blocking something-or-other is helping
    console.log('step 1 downloading all transactions from localbitcoins')
    //grab a read only api key from your localbitcoins account
    var api_key='73yn8y5c1y1c8tny81mhoiqhwo87y9n8'
    var api_secret = '89my5yvoureiut2m3t8u2ymt8qu34tu82h02uhmtoqiuhtm0283thqothouitho4'
    var target_url = 'https://localbitcoins.com/api/dashboard/released/'
    var algorithm = 'sha256'
    var encoding = 'hex'
    while (target_url != null) {
        var the_nonce = nonce() * 10
        var options = yield buildOptions( api_key, the_nonce, target_url, api_secret, algorithm, encoding)
        var result = yield request(options)
        var response = result
        var next_page = yield JSON.parse( response.body ).pagination
        if ( next_page.next != '')  {
            target_url = next_page.next
            thepayload.push(JSON.parse(response.body))
        }
        else
        {
            thepayload.push(JSON.parse(response.body))
        }
    }
    
    // // or grab from local for testing
    // var fs = require('fs');
    // thepayload = yield JSON.parse(fs.readFileSync('transactions.json', 'utf8'))
    
    // monthlyreport =
    // reportVolumeTimeslice(
    //     reportTransactionList(thepayload)
    //     ,"YYYYMM"
    // )
    // console.log(JSON.stringify(monthlyreport, null, 2))
    //
    //
    // weeklyreport = reportVolumeTimeslice(
    //     reportTransactionList(thepayload)
    //     ,"YYYYww"
    // )
    // console.log(JSON.stringify(weeklyreport, null, 2))
    //
    // dailyreport = reportVolumeTimeslice(
    //     reportTransactionList(thepayload)
    //     ,"YYYYMMDD"
    // )
    // console.log(JSON.stringify(dailyreport, null, 2))
    // userreport =
    //     reportVolumeUser(
    //     reportTransactionList(thepayload)
    //     )
    // console.log(JSON.stringify(userreport, null, 2))
    suspiciousactivityreport_day =
        reportSuspiciousActivity(timeperioddays=1, pennies_amt=200000,
        reportTransactionList(thepayload)
        )
    console.log("SAR 2,000 in one day")
    console.log(JSON.stringify(suspiciousactivityreport_day, null, 2))

    suspiciousactivityreport_week =
        reportSuspiciousActivity(timeperioddays=7, pennies_amt=500000,
        reportTransactionList(thepayload)
        )
    console.log("SAR 5,000 in one week")
    console.log(JSON.stringify(suspiciousactivityreport_week, null, 2))

    suspiciousactivityreport_month =
        reportSuspiciousActivity(timeperioddays=30, pennies_amt=1000000,
        reportTransactionList(thepayload)
        )
    console.log("SAR 10,000 in one month")
    console.log(JSON.stringify(suspiciousactivityreport_month, null, 2))
})