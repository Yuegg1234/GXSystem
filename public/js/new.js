var hasQueryResult = true;
var querys;
document.getElementById("svg-body").style.height = document.documentElement.clientHeight * 0.65 + "px";
document.getElementById("map-wrap").style.height = document.documentElement.clientHeight * 0.65 + "px";
var svgW = document.getElementById("svg-body").clientWidth;
var svgH = document.getElementById("svg-body").clientHeight;
var ignoredProps = [];
var callRecords = [{ caller: '18011111111', answeree: '18011111112', callTime: '10:00:00', duration: '10', address: '广州', date: '2018-04-10' },
{ caller: '18011111112', answeree: '18011111111', callTime: '11:00:00', duration: '10', address: '广州2', date: '2018-04-10' }];
var locations = [];//[{ locate: "113.32686 23.28614", count: 0, address: '广东省广州市从化区' }, { locate: "113.50054 23.12311", count: 2, address: '广东省广州市从化区2' }];
var callTimePerDays = [];
var callRanks = { x: [], y: [] };
var triples = [];
var isToDisplayAllText = true;
var isToMouseOver = true;

//var color = d3.scaleOrdinal(d3.schemeCategory10);
var color = d3.scale.category10();
var varlist = ['通话记录编号', '电话号码', '通话时间', '通话时长', '通话地点'];
var legendRectSize = 18;
var legendSpacing = 4;
var nominal_stroke = 1.5;
var max_stroke = 4.5;
var nominal_text_size = 10;
var max_text_size = 24;
var focus_node = null;

function getQueryString() {
    var caller = $("#caller").val();
    var answeree = $("#answeree").val();
    var where = $("#where").val();
    var date = $("#date").val();
    var minDuration = $("#minDuration").val();
    var maxDuration = $("#maxDuration").val();
    /* if (!checkPhone(caller) && caller !== "") {
        alert("主叫人手机号有误，请重填！");
        return 'error';
        //$("#phonemsg").attr("class", "alert alert-warning alert-dismissible");
    } */
    /* if (!checkPhone(answeree) && answeree != "") {
        alert("被叫人手机号有误，请重填！");
        return 'error';
    } */
    if (caller !== "" && caller === answeree) {
        alert("主叫人与被叫人不能相同！");
        return 'error';
    }
    if (caller == '' && answeree == '') {
        alert("主叫人和被叫人不能同时为空！")
        return 'error';
    }
    if (minDuration != "" || maxDuration != "") {
        if (isNaN(parseInt(minDuration)) || isNaN(parseInt(maxDuration))) {
            alert("通话时长只能为数字！");
            return 'error';
        } else if (parseInt(minDuration) > parseInt(maxDuration)) {
            alert("最小时长不能大于最大时长！");
            return 'error';
        } else if (parseInt(minDuration) < 0 || parseInt(maxDuration) < 0) {
            alert("通话时长不能为负数！");
            return 'error';
        }
    }
    if (minDuration == "") minDuration = "null";
    if (maxDuration == "") maxDuration = "null";

    var queryString = "SELECT ?startTime ?endTime ?locate ";
    var caller_X = "", answeree_X = "", year = "", month = "", day = "";
    if (caller === "") {
        caller_X = "?caller";
        queryString += "?caller ";
    } else {
        caller_X = '"' + caller + '"^^xsd:string';
    }
    if (answeree === "") {
        answeree_X = "?answeree";
        queryString += "?answeree ";
    } else {
        answeree_X = '"' + answeree + '"^^xsd:string';
    }
    if (date === "") {
        year = "?year";
        month = "?month";
        day = "?day";
        queryString += "?year ?month ?day ";
    } else {
        var temp = date.split("-");
        year = '"' + temp[0] + '"^^xsd:integer';
        month = '"' + temp[1] + '"^^xsd:integer';
        day = '"' + temp[2] + '"^^xsd:integer';
    }
    queryString = queryString + 'WHERE { ?x "start time" ?startTime . ' + '?x "end time" ?endTime . ' + '?x "locate" ?locate . ' + '?x "call" ' + caller_X + ' . ' + '?x "called" ' + answeree_X + ' . ' + '?x "start year" ' + year + ' . ' + '?x "start month" ' + month + ' . ' + '?x "start day" ' + day + ' . }' + 'min:' + minDuration + ',max:' + maxDuration;
    //queryString = queryString + 'WHERE { ?x "call" ' + caller_X + ' . ' + '?x "called" ' + answeree_X + ' . ' + '?x "start year" ' + year + ' . ' + '?x "start month" ' + month + ' . ' + '?x "start day" ' + day + ' . ' + '?x "start time" ?startTime . ' + '?x "end time" ?endTime . ' + '?x "locate" ?locate . }' + 'min:' + minDuration + ',max:' + maxDuration;
    console.log(queryString);
    return queryString;
}


function getQueryResult() {
    var queryString = getQueryString();
    if (queryString == 'error') return;
    $(".queryLoader").show();
    $(".queryResult").hide();
    var host = 'http://222.20.79.232:51234';
    $.ajax({
        data: { querystr: queryString },
        url: host + "/query",
        dataType: 'json',
        type: 'get',
        success: function (jgraph) {
            $(".queryLoader").hide();
            if(jgraph==0){
                alert("查询结果为空");
                return;
            }
            if (!isJson(jgraph)) {
                jgraph = JSON.parse(jgraph);
            }
            console.log(jgraph);
            callRecords = jgraph.callRecords;
            //console.log(callRecords);
            if (callRecords != undefined) {
                $(".queryResult").hide();
            } else {
                $(".queryResult").html("<div class='alert alert-warning' role='alert'>Fail to create a graph from the given URL.</div>");
                $(".queryResult").show();
                setTimeout(function () {
                    $(".queryResult").hide();
                }, 5000);
            }
            locations = jgraph.locations;
            flag = true;
            $("#avrTime").text(jgraph.averageTime);
            $("#calls").text(jgraph.countCall);
            jgraph.callTimePerDays.forEach(function (item) {
                callTimePerDays.push(item.averageTime);
            });
            //console.log(callTimePerDays);
            jgraph.callRanks.forEach(function (item) {
                callRanks.x.push(item.phoneNumber);
                callRanks.y.push(item.count);
            });
            callTimePeak(callTimePerDays, callRanks);
            callTimePerDays = [];
            callRanks = { x: [], y: [] };
            graph = callRecordsToGraph(callRecords);
            triples = graph.triples;
            varlist = ['通话记录编号', '电话号码', '通话时间', '通话时长', '通话地点'];
            afterQuery();
            generateRdfTable(triples);
            generateQueryResultTable(callRecords);
            update();
        },
        error: function (request, err, ex) {
            $(".queryLoader").hide();
            $(".queryResult").show();
            $(".queryResult").html("<div class='alert alert-warning' role='alert'>Fail to create a graph from the given URL.</div>");
            setTimeout(function () {
                $(".queryResult").hide();
            }, 10000);
        }
    });

    function isJson(obj) {
        var isjson = typeof (obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length;
        return isjson;
    }
}

function checkPhone(phone) {
    if (!(/^1(3|4|5|7|8)\d{9}$/.test(phone))) {
        return false;
    }
    return true;
}


$('.form_date').datetimepicker({
    language: 'zh-CN',
    weekStart: 1,
    todayBtn: 1,
    autoclose: 1,
    todayHighlight: 1,
    startView: 2,
    minView: 2,
    forceParse: 0
});

var queryResult = [];
// CONFIG - END *****************************

var svg = d3.select("#svg-body").append("svg");
svg.attr("width", "100%")
    .attr("height", "100%");



var graph = { nodes: [], links: [], triples: [] };
graph = callRecordsToGraph(callRecords);
$(".queryLoader").hide();
afterQuery();
generateRdfTable(graph.triples);
generateQueryResultTable(callRecords);
update();


$(document).ready(function () {
    //Toggle fullscreen
    $("#panel-fullscreen").click(function (e) {
        e.preventDefault();

        var $this = $(this);

        if ($this.children('i').hasClass('glyphicon-resize-full')) {
            $this.children('i').removeClass('glyphicon-resize-full');
            $this.children('i').addClass('glyphicon-resize-small');
            document.getElementById("svg-body").style.height = document.documentElement.clientHeight - 110 + "px";
            document.getElementById("map-wrap").style.height = document.documentElement.clientHeight - 110 + "px";
            svgW = document.getElementById("svg-body").clientWidth;
            svgH = document.getElementById("svg-body").clientHeight;
        }
        else if ($this.children('i').hasClass('glyphicon-resize-small')) {
            $this.children('i').removeClass('glyphicon-resize-small');
            $this.children('i').addClass('glyphicon-resize-full');
            document.getElementById("svg-body").style.height = document.documentElement.clientHeight * 0.65 + "px";
            document.getElementById("map-wrap").style.height = document.documentElement.clientHeight * 0.65 + "px";
        }
        $(this).closest('.panel').toggleClass('panel-fullscreen');
    });
});


function filterUpdate() {
    graph = callRecordsToGraph(callRecords);
    update();
}
String.prototype.endWith = function (str) {
    if (str == null || str == "" || this.length == 0 || str.length > this.length)
        return false;
    if (this.substring(this.length - str.length) == str)
        return true;
    else
        return false;
    return true;
}

// ----------- QUERY --------------
function afterQuery() {
    var preds = [];
    var counts = [];

    var chks = "";

    var tblProps = $("#tblProperties");
    tblProps.empty();

    graph.triples.forEach(function (triple) {
        var pred = triple.predicate;
        if ($.inArray(pred, preds) === -1) {
            preds.push(pred);
            counts[pred] = 1;
        } else {
            counts[pred]++;
        }
    });

    preds.sort();

    preds.forEach(function (pred) {
        tblProps.append(
            "<div class='checkbox'>"
            + "<label title='" + pred + "'>"
            + "<input id='chkProp' onchange='filterProperties();' type='checkbox' checked/>"
            + pred
            + "</label>"
            + "<span class='badge'>" + counts[pred] + "</span> "
            + "</div>");
    });

}

function filterProperties() {
    ignoredProps = [];
    var chkProps = $("#chkProp:not(:checked)").parent();
    chkProps.each(function (i) {
        ignoredProps.push($(chkProps[i]).attr("title"));
    });

    filterUpdate();
}

function toDisplayAllText(elem) {
    isToDisplayAllText = $(elem).is(":checked");
    filterUpdate();
}
function toMouseOver(elem) {
    isToMouseOver = $(elem).is(":checked");
    filterUpdate();
}


function generateRdfTable(triples) {
    /* triples.sort(function(a, b) {
        return a.vw - b.vw;
    }); */

    var rdfTBody = $("#tblBodyRDF");
    rdfTBody.empty();
    var index = 0;
    triples.forEach(function (triple) {
        var subjId = triple.subject;
        var predId = triple.predicate;
        var objId = triple.object;
        index++;
        rdfTBody.append(
            "<tr>"
            + "<td>" + index + "</td>"
            + "<td>" + subjId + "</td>"
            + "<td>" + predId + "</td>"
            + "<td>" + objId + "</td>"
            + "</tr>");
    });
}

function generateQueryResultTable(list) {
    $("#callRecordsBody").empty();
    var a = "";
    var index = 0;
    for (var j = 0; j < list.length; j++) {
        var a = "<td>" + list[j].caller + "</td>" + "<td>" + list[j].answeree + "</td>" + "<td>" + list[j].date + " " + list[j].callTime + "</td>" + "<td>" + list[j].duration + "</td>" + "<td>" + list[j].address + "</td>";
        index++;
        var tr = "<tr><td>" + index + "</>" + a + "</tr>";
        $("#callRecordsBody").append(tr);
        a = "";
    }
}


function update() {
    // Init Layout
    svgW = $("svg").parent().width();
    force = d3.layout.force().size([svgW, svgH]);
    var rect = svg.append("rect")
        .attr("class", "overlay")
        .attr("width", "100%")
        .attr("height", "100%");
    if (varlist != null) {
        var legend = svg.selectAll('.legend')
            .data(varlist)
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', function (d, i) {
                var height = legendRectSize + legendSpacing;
                var offset = height / 2;
                var horz = legendSpacing;
                var vert = i * height + offset;
                return 'translate(' + horz + ',' + vert + ')';
            });
        legend.append('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', function (d) { return color(varlist.indexOf(d)); })
            .style('stroke', "#999");

        legend.append('text')
            .attr('x', legendRectSize + legendSpacing)
            .attr('y', legendRectSize - legendSpacing)
            .text(function (d) { return d; });
    }



    var gDraw = svg.append("g");
    var zoom = d3.behavior.zoom().scaleExtent([0.2, 5]);



    // ==================== Add Marker ====================

    gDraw.append("svg:defs")
        .append("svg:marker")
        .attr("id", "end")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 11)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .attr("stroke", "#999")
        .attr("fill", "rgba(124, 240, 10, 0)")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5")
        ;
    //blue marker   
    gDraw.append("svg:defs")
        .append("svg:marker")
        .attr("id", "blue")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 11)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .attr("stroke", "blue")
        .attr("fill", "rgba(124, 240, 10, 0)")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5")
        ;

    // ==================== Add Links ====================
    var link = gDraw.selectAll(".link")
        .data(graph.links)
        .enter()
        .append("path")
        .attr("marker-end", "url(#end)")
        .attr("class", "link")
        ;

    // ==================== Add Link Names =====================
    var linkTexts = gDraw.selectAll(".link-text")
        .data(graph.links)
        .enter()
        .append("text")
        .attr("class", "link-text")
        .text(function (d) { return d.label; })
        ;

    linkTexts.append("title")
        .text(function (d) { return d.label });

    // ==================== Add Node Names =====================
    var nodeTexts = gDraw.selectAll(".node-text")
        .data(graph.nodes)
        .enter()
        .append("text")
        .attr("class", "node-text")
        .text(function (d) { return d.id; })
        ;

    nodeTexts.append("title")
        .text(function (d) { return d.id; });


    if (!isToDisplayAllText) {
        nodeTexts.style("visibility", "hidden");
        linkTexts.style("visibility", "hidden");
    }


    // ==================== Add Node =====================
    graph.links.forEach(function (d) {
        d.source.degree += 1;
        d.target.degree += 1;
    });
    var node = gDraw.selectAll(".node")
        .data(graph.nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .call(force.drag);

    var circle = node.append("circle")
        .attr("r", function (d) { return d.degree * 1.3 + 8; })
        .attr("fill", function (d) { return color(d.group); });

    node.on("dblclick.zoom", function (d) {
        d3.event.stopPropagation();
        var dcx = (svgW / 2 - d.x * zoom.scale());
        var dcy = (svgH / 2 - d.y * zoom.scale());
        zoom.translate([dcx, dcy]);
        gDraw.attr("transform", "translate(" + dcx + "," + dcy + ")scale(" + zoom.scale() + ")");
    });

    zoom.on("zoom", function () {
        var stroke = nominal_stroke;
        if (nominal_stroke * zoom.scale() > max_stroke) stroke = max_stroke / zoom.scale();
        link.style("stroke-width", stroke);
        circle.style("stroke-width", stroke);
        var text_size = nominal_text_size;
        if (nominal_text_size * zoom.scale() > max_text_size) text_size = max_text_size / zoom.scale();
        nodeTexts.style("font-size", text_size + "px");
        linkTexts.style("font-size", text_size + "px");

        gDraw.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    });

    node.on("mousedown", function (d) {
        d3.event.stopPropagation();
    })

    svg.call(zoom);

    function linkArc(d) {
        var sourceX = d.source.x;
        var sourceY = d.source.y;
        var targetX = d.target.x;
        var targetY = d.target.y;

        var theta = Math.atan((targetX - sourceX) / (targetY - sourceY));
        var phi = Math.atan((targetY - sourceY) / (targetX - sourceX));

        var sinTheta = (d.source.degree * 1.3 + 8) * Math.sin(theta);
        var cosTheta = (d.source.degree * 1.3 + 8) * Math.cos(theta);
        var sinPhi = (d.target.degree * 1.3 + 8) * Math.sin(phi);
        var cosPhi = (d.target.degree * 1.3 + 8) * Math.cos(phi);

        if (d.target.y > d.target.y) {
            sourceX = sourceX + sinTheta;
            sourceY = sourceY + cosTheta;
        }
        else {
            sourceX = sourceX - sinTheta;
            sourceY = sourceY - cosTheta;
        }

        if (d.source.x > d.target.x) {
            targetX = targetX + cosPhi;
            targetY = targetY + sinPhi;
        }
        else {
            targetX = targetX - cosPhi;
            targetY = targetY - sinPhi;
        }

        return "M" + d.source.x + "," + d.source.y
            + "S" + d.source.x + "," + d.source.y
            + " " + targetX + "," + targetY;
    }

    // ==================== Force ====================
    force.on("tick", function () {
        node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; })
            ;

        link.attr("d", linkArc);

        nodeTexts.attr("x", function (d) { return d.x + d.degree * 1.3 + 8; })
            .attr("y", function (d) { return d.y + 3; })
            ;


        linkTexts
            .attr("x", function (d) { return 4 + (d.source.x + d.target.x) / 2; })
            .attr("y", function (d) { return 4 + (d.source.y + d.target.y) / 2; })
            ;
    });


    // ==================== Run ====================
    force
        .nodes(graph.nodes)
        .links(graph.links)
        .charge(-3000)
        .linkDistance(30)
        .start()
        ;


    var linkedByIndex = {};

    graph.links.forEach(function (d) {
        linkedByIndex[d.source.index + "," + d.target.index] = true;
    });

    function isConnected(a, b) {
        return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a === b;
    }

    var mouseOverFunction = function (d) {
        node.style("opacity", function (o) { return isConnected(o, d) ? 1.0 : 0.2; })
            .style("stroke", function (o) { return isConnected(o, d) ? "blue" : "white"; })
            .style("fill", function (o) { if (isConnected(o, d)) { return color(o.group); } else { return "#000"; } })
            ;

        link.style("opacity", function (o) { return o.source === d || o.target === d ? 1 : 0.2; })
            .style("stroke", function (o) { return o.source === d || o.target === d ? "blue" : "#999"; })
            .style("marker-end", function (o) { return o.source === d || o.target === d ? "url(#blue)" : "url(#end)" })
            ;

        nodeTexts.style("visibility", function (o) { return isConnected(o, d) ? "visible" : "hidden"; })
            .style("font-weight", function (o) { return isConnected(o, d) ? "bold" : "normal"; })
            ;
        linkTexts.style("visibility", function (o) { return o.source === d || o.target === d ? "visible" : "hidden"; })
            .style("font-weight", function (o) { return o.source === d || o.target === d ? "bold" : "normal"; })
            ;

    };

    var mouseOutFunction = function (d) {
        node.style("fill", function (o) { return color(o.group); })
            .style("opacity", 1.0)
            .style("stroke", "white")
            ;

        link.style("opacity", 1.0)
            .style("marker-end", "url(#end)")
            .style("stroke", "#999")
            ;
        nodeTexts.style("font-weight", "normal");
        linkTexts.style("font-weight", "normal");

        if (!isToDisplayAllText) {
            nodeTexts.style("visibility", "hidden");
            linkTexts.style("visibility", "hidden");
        } else {
            nodeTexts.style("visibility", "visible");
            linkTexts.style("visibility", "visible");
        }

    };

    if (isToMouseOver) {
        node.on("mouseover", mouseOverFunction)
            .on("mouseout", mouseOutFunction);
    }


}

function callRecordsToGraph(records) {
    svg.html("");
    var graph = { nodes: [], links: [], triples: [] };
    var nodeIds = [];
    records.forEach(function (item, index) {
        var numNode = { id: (index + 1).toString(), group: 0, degree: 0 },
            callerNode, answereeNode, callTimeNode, durationNode, addressNode;
        graph.nodes.push(numNode);
        if (nodeIds.indexOf(item.caller) == -1) {
            nodeIds.push(item.caller);
            callerNode = { id: item.caller, group: 1, degree: 0 };
            graph.nodes.push(callerNode);
        } else {
            callerNode = getNodeById(item.caller);
        }

        if (nodeIds.indexOf(item.answeree) == -1) {
            nodeIds.push(item.answeree);
            answereeNode = { id: item.answeree, group: 1, degree: 0 };
            graph.nodes.push(answereeNode);
        } else {
            answereeNode = getNodeById(item.answeree);
        }

        if (nodeIds.indexOf(item.callTime) == -1) {
            nodeIds.push(item.date + ' ' + item.callTime);
            callTimeNode = { id: item.date + ' ' + item.callTime, group: 2, degree: 0 };
            graph.nodes.push(callTimeNode);
        } else {
            callTimeNode = getNodeById(item.date + ' ' + item.callTime);
        }

        if (nodeIds.indexOf(item.duration) == -1) {
            nodeIds.push(item.duration);
            durationNode = { id: item.duration + '秒', group: 3, degree: 0 };
            graph.nodes.push(durationNode);
        } else {
            durationNode = getNodeById(item.duration + '秒');
        }

        if (nodeIds.indexOf(item.address) == -1) {
            nodeIds.push(item.address);
            addressNode = { id: item.address, group: 4, degree: 0 };
            graph.nodes.push(addressNode);
        } else {
            addressNode = getNodeById(item.address);
        }
        if (ignoredProps.indexOf('主叫人') == -1) {
            graph.links.push({ source: numNode, target: callerNode, label: '主叫人' });
        }

        if (ignoredProps.indexOf('被叫人') == -1) {
            graph.links.push({ source: numNode, target: answereeNode, label: '被叫人' });
        }

        if (ignoredProps.indexOf('时间') == -1) {
            graph.links.push({ source: numNode, target: callTimeNode, label: '时间' });
        }

        if (ignoredProps.indexOf('时长') == -1) {
            graph.links.push({ source: numNode, target: durationNode, label: '时长' });
        }

        if (ignoredProps.indexOf('地点') == -1) {
            graph.links.push({ source: numNode, target: addressNode, label: '地点' });
        }

        graph.triples.push(
            { subject: (index + 1).toString(), predicate: '主叫人', object: item.caller },
            { subject: (index + 1).toString(), predicate: '被叫人', object: item.answeree },
            { subject: (index + 1).toString(), predicate: '时间', object: item.date + ' ' + item.callTime },
            { subject: (index + 1).toString(), predicate: '时长', object: item.duration },
            { subject: (index + 1).toString(), predicate: '地点', object: item.address },
        );


    });
    return graph;

    function getNodeById(id) {
        var node;
        graph.nodes.forEach(function (item) {
            if (item.id === id) {
                node = item;
            }
        });
        return node;
    }
}

//mapshow
document.getElementById("map-wrap").style.display = "none";
var map;
var flag = true;
function mapShowOrHide() {
    if (flag) {
        document.getElementById("map-wrap").style.display = "block";
        setTimeout(function () {
            var map = new BMap.Map('map-wrap');
            var size1 = new BMap.Size(23, 25);
            var size2 = new BMap.Size(11.5, 25);
            var letter,
                icon,
                markers = [];
            map.centerAndZoom(new BMap.Point(113.2644, 23.1291), 11);
            map.enableScrollWheelZoom(true);
            var image = new Image();
            image.crossOrigin = '*';
            image.onload = function () {
                var width = this.width;
                var height = this.height;
                for (var i = 0; i < locations.length; i++) {
                    var letter = '';
                    var num = locations[i].count;
                    var t = num;
                    var len = num.toString().length;
                    for (var j = len - 1; j >= 0; j--) {
                        letter += String.fromCharCode(t / (Math.pow(10, j)) + 48);
                        var t = t % (Math.pow(10, j));
                    }
                    var canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(this, 0, 0, width, height);
                    ctx.textAlign = 'center';
                    ctx.font = 'bold 10px sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(letter, 9.5, height / 2);
                    icon = new BMap.Icon(canvas.toDataURL(), size1, { anchor: size2 });
                    //marker = new BMap.Marker(new BMap.Point(points[i].latitude, points[i].longitude), { icon: icon });
                    marker = new BMap.Marker(new BMap.Point(locations[i].locate.split(' ')[0], locations[i].locate.split(' ')[1]), { icon: icon });
                    //var content = points[i].address;
                    var content = locations[i].address;
                    map.addOverlay(marker);
                    addClickHandler(content, marker, map);
                }
            }
            image.src = '../images/marker.png';
        }, 5);
    }
    flag = false;
    function addClickHandler(content, marker, map) {
        marker.addEventListener("click", function (e) {
            openInfo(content, e, map)
        }
        );
    }
    function openInfo(content, e, map) {
        var opts = {
            width: 250,     // 信息窗口宽度    
            height: 50,     // 信息窗口高度    
            title: "详细地址"  // 信息窗口标题   
        }
        var p = e.target;
        var point = new BMap.Point(p.getPosition().lng, p.getPosition().lat);
        var infoWindow = new BMap.InfoWindow(content, opts);  // 创建信息窗口对象 
        map.openInfoWindow(infoWindow, point); //开启信息窗口
    }


}
//points is array [{latitude:?, latitude:?}....]
function addMarker(points) {
    var width = this.width;
    var height = this.height;
    var icon;
    points.forEach(function (i) {

        var letter = i.value + 48;
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(this, 0, 0, width, height);
        ctx.textAlign = 'center';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(String.fromCharCode(letter), 9.5, height / 2);
        icon = new BMap.Icon(canvas.toDataURL(), size1, { anchor: size2 });
        var marker = new BMap.Marker(new BMap.Point(i.latitude, i.longitude), { icon: icon });
        map.addOverlay(marker);
        addClickHandler(content, marker);
    });

}

function callTimePeak(data, rank) {
    document.getElementById("callTimePeak").style.height = document.documentElement.clientHeight * 0.45 + "px";
    document.getElementById("callTimePeak").style.width = document.documentElement.clientHeight * 0.6 + "px";
    var myChart = echarts.init(document.getElementById('callTimePeak'));
    var option = {
        title: {
            text: '平均每天通话时间点'
        },
        xAxis: {
            type: 'category',
            name: '时间',
            boundaryGap: false,
            //data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun','Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun','Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun','Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            data: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23']
        },
        yAxis: {
            type: 'value',
            name: '通话次数'
        },
        series: [{
            data: data,//[8, 9, 9, 9, 12, 13, 13, 8, 9, 9, 9, 12, 1, 13, 8, 9, 9, 9, 12, 13, 13, 9, 9, 9],
            //data: [820, 932, 901, 934, 1290, 1330, 1320,820, 932, 901, 934, 1290, 1330, 1320,820, 932, 901, 934, 1290, 1330, 1320,820, 932, 901, 934, 1290, 1330, 1320],
            type: 'line',
            areaStyle: {}
        }],
        tooltip: {
            trigger: 'axis',
            formatter: "通话次数 <br/>{b}点后一小时内 : {c} 次"
        },
    };
    myChart.setOption(option);

    document.getElementById("top10").style.height = document.documentElement.clientHeight * 0.45 + "px";
    document.getElementById("top10").style.width = document.documentElement.clientHeight * 0.6 + "px";
    var myChart2 = echarts.init(document.getElementById('top10'));
    var option1 = {
        title: {
            text: '通话次数排名'
        },
        color: ['#3398DB'],
        tooltip: {
            trigger: 'axis',
            axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
            }
        },
        xAxis: [
            {
                type: 'category',
                data: rank.x,//['18011111111', '18011111112', '18011111113', '18011111114', '18011111115', '18011111116', '18011111117'],
                axisTick: {
                    alignWithLabel: true
                }
            }
        ],
        yAxis: [
            {
                name: '通话次数',
                type: 'value'
            }
        ],
        series: [
            {
                name: '通话次数：',
                type: 'bar',
                barWidth: '60%',
                data: rank.y//[10, 9, 8, 7, 6, 5, 4]
            }
        ]
    };
    myChart2.setOption(option1);
}