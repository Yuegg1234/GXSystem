document.getElementById("map-wrap").style.display = "none";
var flag = true;
var map;
var points = [{ latitude: 113.32686, longitude: 23.28614, value: 0 }, { latitude: 113.50054, longitude: 23.12311, value: 2 }]
function mapShowOrHide() {
    document.getElementById("map-wrap").style.display = "block";
    if (flag) {
        setTimeout(function () {
            var map = new BMap.Map('map-wrap');
            var size1 = new BMap.Size(23, 25);
            var size2 = new BMap.Size(11.5, 25);
            var letter,
                points = [{ latitude: 113.32686, longitude: 23.28614, value: 20, address: '广东省广州市从化区' }, { latitude: 113.50054, longitude: 23.12311, value: 13, address: '广东省广州市从化区2' }],
                icon,
                markers = [];
            map.centerAndZoom(new BMap.Point(113.2644, 23.1291), 11);
            map.enableScrollWheelZoom(true);
            var image = new Image();
            image.crossOrigin = '*';
            image.onload = function () {
                var width = this.width;
                var height = this.height;
                for (var i = 0; i < points.length; i++) {
                    var letter = '';
                    var num = points[i].value;
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
                    marker = new BMap.Marker(new BMap.Point(points[i].latitude, points[i].longitude), { icon: icon });
                    var content = points[i].address;
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
callTimePeak();
function callTimePeak() {
    document.getElementById("callTimePeak").style.height = document.documentElement.clientHeight * 0.45 + "px";
    document.getElementById("callTimePeak").style.width = document.documentElement.clientHeight * 0.6 + "px";
    var myChart = echarts.init(document.getElementById('callTimePeak'));
    var option = {
        title: {
            text: '平均每天通话时间点'
        },
        xAxis: {
            type: 'category',
            name:'时间',
            boundaryGap: false,
            //data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun','Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun','Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun','Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            data: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23']
        },
        yAxis: {
            type: 'value',
            name: '通话次数'
        },
        series: [{
            data: [8, 9, 9, 9, 12, 13, 13, 8, 9, 9, 9, 12, 1, 13, 8, 9, 9, 9, 12, 13, 13, 9, 9, 9],
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
    var option1  = {
        title: {
            text: '通话次数排名'
        },
        color: ['#3398DB'],
        tooltip : {
            trigger: 'axis',
            axisPointer : {            // 坐标轴指示器，坐标轴触发有效
                type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
            }
        },
        xAxis : [
            {
                type : 'category',
                data : ['18011111111', '18011111112', '18011111113', '18011111114', '18011111115', '18011111116', '18011111117'],
                axisTick: {
                    alignWithLabel: true
                }
            }
        ],
        yAxis : [
            {
                name:'通话次数',
                type : 'value'
            }
        ],
        series : [
            {
                name:'通话次数：',
                type:'bar',
                barWidth: '60%',
                data:[10, 9, 8, 7, 6, 5, 4]
            }
        ]
    };
    myChart2.setOption(option1);
}

