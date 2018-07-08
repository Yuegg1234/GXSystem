var net = require('net');
exports.query = function (queryString, cb) {
    var host = '11.11.11.10';
    //var port = 55439;
    //var host = '202.114.7.51';
    var port = 2013;
    var client = new net.Socket();
    client.connect(port, host, function () {
        console.log('connected!');
        //var buffer = queryBuffer(queryString);
        client.write(queryString);
        client.write('\nbreak\n');
    });

    var curLen = 0, trueLen = 0;
    var flag = true;
    var bufArray = [];
    var length;
    var res='';
    client.on('data', function(buffer){
        if(flag) {
            //trueLen = buffer.readInt32LE(0);
            length = parseInt(buffer.toString());
            console.log(length);
            if(length ===0){
                cb(res);
            }
            flag = false;
        }else{
            //console.log(buffer.toString());
            bufArray.push(buffer);
            curLen+=buffer.length;
            //console.log("111111")
            if(curLen - 1 === length){
                //console.log(Buffer.from(bufArray).length);
                bufArray.forEach(function(i){
                    res+=i.toString();
                });
                cb(res);
                //console.log(res);
                bufArray=[];
                //console.log(Buffer.from(bufArray).toString());
                //cb(Buffer.from(bufArray).toString('utf-8'));
                //client.destroy();
            }
            //console.log(curLen);
        }
        
        //return; 
    })
    /* client.on('data', function (buffer) {
        bufArray.push(buffer);
        //console.log(buffer.length);
        curLen += buffer.length;
        if (flag) {
            trueLen = buffer.readUInt32LE(0);
            flag = false;
        }
        if (curLen - 4 === trueLen) {
            var totalLength = 0;
            bufArray.forEach(function (i) {
                totalLength += i.length;
            });
            var totalBuffer = Buffer.concat(bufArray, totalLength);
            var data = executeResult(totalBuffer);
            res = getTrueData(data, vars, triples);
            if (isD3) {
                var rdfdata = res.RDFData;
                var Triples = [];
                for (var i = 0; i < rdfdata.length - 2; i += 3) {
                    var triple = {};
                    triple.subject = rdfdata[i];
                    triple.predicate = rdfdata[i + 1];
                    triple.object = rdfdata[i + 2];
                    Triples.push(triple);
                }
                res.Triples = Triples;

            }
            //console.log(res);
            cb(res);
            client.destroy();
        }
    }); */

}

//将查询语句转换成buffer
function queryBuffer(queryString) {
    var length = Buffer.from(queryString).length;
    var buffer = Buffer.alloc(length + 4);
    //buffer.writeInt32LE(length);
    buffer.writeUInt32LE(length >>> 0);
    buffer.write(queryString, 4);
    return buffer;
}



//将buffer转换成结果数组
function executeResult(buffer) {
    var res = [];
    var index = 4;
    var sb = [];
    for (var i = 4; i < buffer.length; i++) {
        if (buffer.readInt8(i) === 0) {
            sb.splice(0, sb.length);
            for (var j = index; j < i; j++) {
                sb.push(buffer[j]);
            }
            index = i + 1;
            res.push(Buffer.from(sb).toString('utf-8'));
        }
    }
    return res;
}

function getTriples(queryString) {
    var res = '';
    var ss = queryString.substring(queryString.indexOf('{') + 1).trim().split(/"\s+"\s?}?|\s+"\s?}?|"\s+\.?\n?\s?}?|\s+"\s?}?|\s+\.\n?\s?}?/);
    ss.pop();
    ss.forEach(function (s) {
        res += s + '$$$';
    });
    return res;
}

function getVarList(queryString) {
    var res = [];
    var ss = queryString.substring(0, queryString.indexOf('{')).split(/\s+/);
    ss.forEach(function (s) {
        if (s.length > 1 && s.charAt(0) === '?') {
            res.push(s);
        }
    });
    return res;
}

function getTrueData(data, vars, triples) {
    var res = {};
    var size = data.length;
    var temp = triples;
    var RDFData = [];
    var varList = {};
    for (var i = 0; i < vars.length; i++) {
        varList[vars[i].substring(1)] = [];
    }
    for (var i = 1, j = 0; i < size - 1; i++) {
        temp = temp.replace(new RegExp('\\' + vars[j], 'g'), data[i] + '###' + vars[j]);
        varList[vars[j].substring(1)].push(data[i]);
        j++;
        if (j === vars.length) {
            j = 0;
            var strList = temp.split('$$$');
            strList.pop();
            strList.forEach(function (s) {
                RDFData.push(s);
            });
            temp = triples;
        }
    }
    res.RDFData = RDFData;
    res.varList = varList;
    res.Time = data[size - 1];
    res.vars = vars;
    res.Size = (size - 2) / vars.length;
    return res;
}

