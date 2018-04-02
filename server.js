var express = require('express');
var path = require('path');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
users = [];
connections = [];
// nbrs = [];
// var counter = 0;
votes = [];
colors = [['rgba(255,0,0,0.7)', '#fff'], ['rgba(255,199,0,0.7)', '#fff'], ['rgba(255,165,0,0.7)', '#fff'], ['rgba(134,255,0,0.7)', '#fff'], ['rgba(0,172,21,0.7)', '#fff'],
    ['rgba(0,255,242,0.7)', '#fff'], ['rgba(97,0,255,0.7)', '#fff'], ['rgba(238,0,255,0.7)', '#fff'], ['rgba(238,128,255,0.7)', '#fff'], ['rgba(0,0,0,0.7)', '#fff'], ['rgba(255,255,255,0.7)', '#000']];
usedColors = [];
questions = [];
questionsCounter = 0;
currentQuestion = 'Waiting for Question';

const writePhase = "0", guessPhase = "1", resultPhase = "2";

phase = writePhase;

userBuffer = [];

randomOrder = [];

colorUserPair = [];

answers = [];
answerCounter = 0;
notAnsweredColors = [];
currentAnswerer = '';

app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.get('/', function (req, res) {
    res.redirect('index.html');
    res.redirect('js/client.js');
    res.redirect('images/coffeecup.jpg');
    res.redirect('english.json');
    res.redirect('swedish.json');
});

lang = loadJsonFile('en');

server.listen(process.env.PORT || 80);
console.log('Server running...');

app.use("/public", express.static(__dirname + "/public"));


questions = createQuestionArray('haveQuestions-en.txt');
shuffleArray(questions);

io.sockets.on('new user', function (socket) {
    console.log("Outside new user");
});

io.sockets.on('connection', function (socket) {
    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);


    socket.on('get lang', function(){
        socket.emit(lang);
    });


    socket.on('reset all', function(){
        users = [];
        connections = [];
        usedColors = [];
        phase = writePhase;
        votes = [];
        colors = [['rgba(255,0,0,0.7)', '#fff'], ['rgba(255,199,0,0.7)', '#fff'], ['rgba(255,165,0,0.7)', '#fff'], ['rgba(134,255,0,0.7)', '#fff'], ['rgba(0,172,21,0.7)', '#fff'],
            ['rgba(0,255,242,0.7)', '#fff'], ['rgba(97,0,255,0.7)', '#fff'], ['rgba(238,0,255,0.7)', '#fff'], ['rgba(238,128,255,0.7)', '#fff'], ['rgba(0,0,0,0.7)', '#fff'], ['rgba(255,255,255,0.7)', '#000']];

        userBuffer = [];

        randomOrder = [];

        colorUserPair = [];

        answers = [];
        answerCounter = 0;
        notAnsweredColors = [];
        currentAnswerer = '';
    });

    //Disconnect
    socket.on('disconnect', function (data) {
        var index = users.indexOf(socket.username);
        console.log("Disconnect called");
        if (index >= 0) {
            username = users.splice(index, 1);
            votes.splice(index, 1);
            color = usedColors.splice(index, 1);
            userBuffer.splice(getIndex(userBuffer, username), 1);
            notAnsweredColors.splice(getIndex(notAnsweredColors, socket.username), 1);
            colorUserPair.splice(getIndex(colorUserPair, socket.username), 1);
            if (color[0] != undefined) {
                colors.push(color[0]);
            }
            updateColors();
            updateUsers();
            updateVotes();
            updateVoteButtons();
            io.sockets.emit('get notAnswerColors', notAnsweredColors);
            console.log("Not answered", notAnsweredColors);
        }
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected: %s sockets connceted.', connections.length);
        console.log('User array:', users);
    });


    socket.on('new round', function () {
        console.log("New Round");
        fillUserBuffer();
        phase = writePhase;
        currentQuestion = '';
        randomOrder = [];
        votes = [];
        answers = [];
        answerCounter = 0
        notAnsweredColors = [];
        for (i = 0; i < users.length; i++) {
            votes.push(0);
        }
        colorUserPair.forEach(function (pair) {
            notAnsweredColors.push([pair[0], pair[1]]);
        });
        currentQuestion = '';
        io.sockets.emit('new round');
    });

    socket.on('get notAnswerColors', function () {
        io.sockets.emit('get notAnswerColors', notAnsweredColors);
    });

    socket.on('get next answer', function () {
        getNextAnswer();
    });

    socket.on('force guess phase', function(){
        enterGuessPhase();
    });

    function enterGuessPhase(){
        randomOrder = createRandomOrder();
        io.sockets.emit('enter guess phase');
        io.sockets.emit('get voteButtons', usedColors, users);
        phase = guessPhase;
        getNextAnswer();
    }

    socket.on('send answer', function (username, color, answer) {
        console.log(username, color, answer);
        answers.splice(users.indexOf(username), 0, answer);
        var index = getIndex(notAnsweredColors, username);
        notAnsweredColors.splice(index, 1);
        if (notAnsweredColors.length == 0) {
            enterGuessPhase();
        }
    });

    function createRandomOrder() {
        var arr = [];
        for (i = 0; i < users.length; i++) {
            arr.push(i);
        }
        return shuffleArray(arr);
    }

    // // Send Message
    // socket.on('send message', function (data) {
    //     console.log(data);
    //     console.log(getUserNbr(socket.username));
    //     io.sockets.emit('new message', {msg: data, user: socket.username, nmr: users.indexOf(socket.username)});
    // });

    //Use Question
    socket.on('use question', function (data) {
        resetVotes();
        currentQuestion = data;
        io.sockets.emit('new question', data);
    });

    socket.on('get question', function (data) {
        socket.emit('get question', currentQuestion);
    });

    function getIndex(array, comp) {
        for (i = 0; i < array.length; i++) {
            console.log("array[i][0]", array[i][0]);
            if (array[i][0] == comp) {
                return i;
            }
        }
        return -1;
    }

    function fillUserBuffer(){
        console.log("fill user buffer");
        userBuffer.forEach(function(data){
            console.log(data);
            users.push(data.name);
            notAnsweredColors.push([data.name, data.clr]);
            votes.push(0);
        });
        userBuffer = [];
        console.log("After fillusers, Users", users);
    }


    // New User
    socket.on('new user', function (username, color, callback) {
        if (users.indexOf(username) == -1) {
            callback(true);
            socket.username = username;
            usedColors.push(color);
            colorUserPair.push([username, color]);
            colors.splice(getIndex(colors, color[0]), 1);
            // nbrs.push([socket.username, counter]);
            // counter++;
            if(phase == writePhase){
                users.push(socket.username);
                notAnsweredColors.push([username, color]);
                votes.push(0);
            } else {
                userBuffer.push({name: username, clr: color});
            }
            updateVoteButtons();
            updateColors();
            updateUsers();
            updateVotes();
            socket.emit('get phase', phase);
        } else {
            socket.emit('username taken');
        }
    });

    //Correct Vote
    socket.on('new vote', function (userNbr) {
        console.log(userNbr, users.indexOf(currentAnswerer));
        if (userNbr == users.indexOf(currentAnswerer)) {
            votes[userNbr] = votes[userNbr] + 1;
            // console.log(answers);
            // updateVotes();
        }
    });

    //Old Vote
    socket.on('old vote', function (voteNbr) {
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
        console.log(colors);
        io.sockets.emit('get colors', colors);
    });

    socket.on('get result', function(){
       socket.emit('get result', users, answers, votes);
    });

    function getNextAnswer() {
        if (answerCounter == answers.length) {
            phase = resultPhase;
            io.sockets.emit('enter result phase', users, answers, votes);
        } else {
            io.sockets.emit('get next answer', answers[randomOrder[answerCounter]], currentQuestion);
            currentAnswerer = users[randomOrder[answerCounter]];
            answerCounter++;
        }
    }

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

    // function getUserNbr(username) {
    //     var i = 0;
    //     var res = undefined;
    //     while (i < nbrs.length) {
    //         if (nbrs[i][0] == username) {
    //             return nbrs[i][1];
    //         }
    //         i++;
    //     }
    //     return undefined;
    // }
});


function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function loadJsonFile(language){
    fileName = '';
    if(language == 'se'){
        fileName = 'swedish.json';
    } else if(language == 'en'){
        fileName = 'english.json';
    }
    var data = fs.readFileSync(fileName);
    return JSON.parse(data);
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