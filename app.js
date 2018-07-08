var express = require('express');
var path = require('path');
var routes = require('./routes/index');
var port = process.env.PORT || 1234;
var app = express();

app.set('views', './views/pages');
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));
app.listen(port);

console.log('app is started on port ' + port);
app.use('/', routes);
/* app.get('/', function (req, res) {
    res.render('index', {
        title: '首页'
    })
})

app.get('/performance', function (req, res) {
    res.render('performance', {
        title: '性能对比'
    })
}) */
