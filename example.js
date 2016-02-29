"use strict"

var sqlite3 = require('sqlite3').verbose();
var util = require('util');
var db = new sqlite3.Database('./data.db');
db.serialize(()=>{
	db.run("CREATE TABLE if not exists link (infohash text PRIMARY KEY, name text, link text)");
});

var DHTSpider = require('./p2pspider/dhtspider');
var BTClient = require('./p2pspider/btclient');

var btclient = new BTClient({ timeout: 1000 * 10 });
var stmt = db.prepare("insert OR IGNORE into link (infohash, name, link) values(?,?,?)");
btclient.on('complete', (metadata, infohash, rinfo) => {

    // metadata.info 含有资源名字, 资源大小, 资源文件列表等信息.
    
    var name = metadata.info.name || metadata.info['utf-8.name'];
    if (name) {
        console.log('\n');
        console.log('name: %s', name.toString());
        console.log('from: %s:%s', rinfo.address, rinfo.port );
        var link = util.format('magnet:?xt=urn:btih:%s', infohash.toString('hex'));
	console.log('link: ' + link);
	stmt.run(infohash.toString('hex'), name.toString(), link)
    }
});

DHTSpider.start({
    btclient: btclient,
    address: '0.0.0.0',
    port: 6219,
    nodesMaxSize: 4000  // 值越大, 网络, 内存, CPU 消耗就越大, 收集速度会变慢.
});
