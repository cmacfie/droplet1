var express = require('express');
var path = require('path');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
users = [];
connections = [];
nbrs = [];
var counter = 0;
votes = [];
colors = [['rgba(255,0,0,0.7)', '#fff'], ['rgba(255,199,0,0.7)', '#fff'], ['rgba(134,255,0,0.7)', '#fff'],
    ['rgba(0,255,242,0.7)', '#fff'], ['rgba(97,0,255,0.7)', '#fff'], ['rgba(238,0,255,0.7)', '#fff'], ['rgba(0,0,0,0.7)', '#fff'], ['rgba(255,255,255,0.7)', '#000']];
usedColors = [];
questions = [];
questionsCounter = 0;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/css', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.get('/', function (req, res) {
    res.redirect('index.html');
    res.redirect('js/client.js');
    res.redirect('images/coffeecup.jpg');
    res.redirect('questions.txt');
});

server.listen(process.env.PORT || 3000);
console.log('Server running...');

app.use("/public", express.static(__dirname + "/public"));

io.sockets.on('connection', function (socket) {
    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);

    questions = createQuestionArray('questions.txt');
    shuffleArray(questions);

    //Disconnect
    socket.on('disconnect', function (data) {
        var index = users.indexOf(socket.username);
        if (index > 0) {
            users.splice(index, 1);
            votes.splice(index, 1);
            color = usedColors.splice(index, 1);
            if (color != '') {
                colors.push(color);
            }
            updateColors();
            updateUsers();
            updateVotes();
            updateVoteButtons();
        }
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected: %s sockets connceted', connections.length);
    });

    // Send Message
    socket.on('send message', function (data) {
        console.log(data);
        console.log(getUserNbr(socket.username));
        io.sockets.emit('new message', {msg: data, user: socket.username, nmr: users.indexOf(socket.username)});
    });

    //Use Question
    socket.on('use question', function (data) {
        resetVotes();
        io.sockets.emit('new question', data);
    });

    function getIndex(array, comp){
        for(i = 0; i < array.length; i++){
            if(array[i][0] == comp){
                return i;
            }
        }
        return -1;
    }

    // New User
    socket.on('new user', function (username, color, callback) {
        callback(true);
        socket.username = username;
        users.push(socket.username);
        usedColors.push(color);
        var index = getIndex(colors, color[0]);
        console.log(index);
        colors.splice(index, 1);
        nbrs.push([socket.username, counter]);
        votes.push(0);
        counter++;
        updateVoteButtons();
        updateColors();
        updateUsers();
        updateVotes();
    });

    //New Vote
    socket.on('new vote', function (voteNbr) {
        votes[voteNbr] = votes[voteNbr] + 1;
        updateVotes();
    });

    //New Random Question
    socket.on('shuffle question', function () {
        var q = questions[questionsCounter % questions.length];
        io.sockets.emit('new shuffled question', q);
        questionsCounter++;
    });

    //Reset Votes
    socket.on('reset votes', function () {
        resetVotes();
    });

    //Send Colors
    socket.on('get colors', function () {
        io.sockets.emit('get colors', colors);
    });

    function updateColors() {
        io.sockets.emit('get colors', colors);
    }

    function resetVotes() {
        for (var i = 0; i < votes.length; i++) {
            votes[i] = 0;
        }
        updateVotes();
        io.sockets.emit('voting reset');
    }

    function updateVotes() {
        io.sockets.emit('get votes', votes);
    }

    function updateVoteButtons() {
        io.sockets.emit('get voteButtons', usedColors, users);
    }

    function updateUsers() {
        io.sockets.emit('get users', users);
    }

    function getUserNbr(username) {
        var i = 0;
        var res = undefined;
        while (i < nbrs.length) {
            if (nbrs[i][0] == username) {
                return nbrs[i][1];
            }
            i++;
        }
        return undefined;
    }

    function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    function createQuestionArray(filename) {
        questions = [];
        allQuestions = fs.readFileSync(filename, 'utf-8');
        var splitted = allQuestions.split(';');
        for (var i = 0; i < splitted.length; i++) {
            if (splitted[i].length > 0) {
                questions.push(splitted[i].trim());
            }
        }
        return questions;
    }

});