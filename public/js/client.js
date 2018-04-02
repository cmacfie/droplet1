/**
 * Created by Christoffer on 2018-03-23.
 */
$(function () {
    var socket = io.connect();
    var $messageForm = $('#messageForm');
    var $useOwnQuestion = $('#useOwnQuestion');
    var $question = $('#question');
    var $questionArea = $('#questionArea');
    var $buttonHolder = $('.buttonHolder');
    var $chat = $('#chat');
    var $messageArea = $('#messageArea');
    var $userForm = $('#userForm');
    var $userFormArea = $('#userFormArea');
    var $users = $('#users');
    var $username = $('#username');
    var $buttons = $('.voteButton');
    var $colorHolder = $('#colorHolder');
    var $colorSquares = $('.colorSquare');
    var $textEnterArea = $('#textEnterArea');
    var $answer = $('#answer');
    var $ownAnswerArea = $('#ownAnswerArea');
    var $votingButtonHolder = $('.votingButtonHolder');
    var $nextAnswerButton = $('#nextAnswerButton');
    var $newRoundButton = $('#newRoundButton');

    const writePhase = "0", guessPhase = "1", resultPhase = "2";

    var waitingForNextRound = false;

    var hasVoted = false;
    var isAdmin = false;
    var username = '';
    var color = '';

    var loggedIn = false;

    var justLoggedIn = true;

    var colors = [];
    var lastTarget;

    var shuffledQuestion = '';


    // var lang = {};
    var lang;
    getLanguage('en');
    setUpLanguage();

    $(document).on('click', '#test', function () {
        setUpLanguage();
        console.log(lang);
    })


    socket.emit('get colors');
    socket.emit('get lang');

    $(document).on('click', '.langBtn', function(event){
       if(event.target.id == 'langBtn-en'){
           getLanguage('en');
       } else if(event.target.id == 'langBtn-se'){
           getLanguage('se');
       }
        setUpLanguage()
    });

    socket.on('get colors', function (data) {
        // console.log(data);
        colors = data;
        var html = '<ul>';
        for (var i = 0; i < data.length; i++) {
            html += '<li type="button" class="colorSquare"'
            html += 'style="cursor : pointer; background-color:' + data[i][0] + '; color:"' + data[i][1] + '"';
            html += '></li>'
        }
        if (!loggedIn && data.indexOf(color) == -1) {
            color = '';
        }
        html += '</ul>';
        $('#loadingColors').hide();
        $colorHolder.html(html);
    });

    $(document).on('click', '#disonnectAll', function () {
        socket.emit('disconnect all');
    });

    $(document).on('click', '.colorSquare', function (event) {
        if (lastTarget != undefined) {
            lastTarget.css({'opacity': '', 'border': ''})
        }
        lastTarget = $(event.target);
        color = colors[$('.colorSquare').index(this)];
        $(event.target).css({'opacity': '1', 'border': '2px white solid'});
    });


    $('#resetVotesButton').click(function (event) {
        socket.emit('reset votes');
    });

    $(document).on('click', '#shuffleRandomQuestion', function (event) {
        socket.emit('shuffle question');
        $('#useRandomQuestionButton').addClass("notransform");
    });

    $(document).on('click', '#useRandomQuestionButton', function (event) {
        if (shuffledQuestion != '') {
            socket.emit('use question', shuffledQuestion);
            $('#useRandomQuestionButton').removeClass('notransform', 300, 'linear');
        }
    });

    $(document).on('click', '#activateOwnQuestion', function (event) {
        $messageArea.show();
        $buttonHolder.hide();
        $questionArea.hide();
    });

    $(document).on('click', '#backButton', function (event) {
        $messageArea.hide();
        $buttonHolder.show();
        $questionArea.show();
    });

    socket.on('new shuffled question', function (data) {
        shuffledQuestion = data;
        if (isAdmin) {
            $question.html('<h2>' + data + '</h2>');
        }
    });

    $messageForm.submit(function (e) {
        e.preventDefault();
        socket.emit('use question', $useOwnQuestion.val());
        $useOwnQuestion.val('');
        $messageArea.hide();
        $buttonHolder.show();
        $questionArea.show();
    });

    $(document).on('click', '.voteButton', function (event) {
        if (!hasVoted) {
            hasVoted = true;
            socket.emit('new vote', this.id);
            $('.voteButton').each(function(button){
                var isOwnTarget = false;
                $(this).children('div').each(function(){
                    if(event.target.id == this.id){
                        isOwnTarget = true;
                    }
                });
                if(!isOwnTarget){
                    $(this).addClass('greyButton');
                } else {
                    $(this).css('border-color', 'blue');
                    $(this).addClass('blue');
                }
            });
        }
    });

    $(document).on('click', '#activateAdmin', function (event) {
        isAdmin = true;
        if ($('#adminArea').is(':visible')) {
            $('#ownAnswerArea').addClass('center');
            $('#adminArea').hide();
        } else {
            $('#ownAnswerArea').removeClass('center');
            $('#adminArea').show();
        }
    })


    $(document).on('click', '#forceNewRound', function () {
        socket.emit('new round');
    })


    socket.on('enter result phase', function (users, answers, votes) {
        if (!waitingForNextRound) {
            $('.voteButton').each(function(button){
                $(this).removeClass('greyButton');
                $(this).css('border-color', 'inherit');
                $(this).removeClass('blue');
            });
            $nextAnswerButton.hide();
            $newRoundButton.show();
            $question.html('<h1 style="font-size:10vw">'+lang.result+'</h1>');
            // console.log(users, answers, votes);
            for (i = 0; i < users.length; i++) {
                $('#username-' + users[i]).html(users[i])
                $('#voteNumber-' + users[i]).html('<h3>' + lang.theirAnswer + ':</h3>' + answers[i])
                $('#answer-' + users[i]).html('<h3>' + lang.correctGuesses + ': </h3>' + votes[i])
            }
            $('.voteNumber').show();
            $('.answer').show();
        }
    });

    function enterGuessPhase() {
        $buttonHolder.hide();
        $nextAnswerButton.show();
        $ownAnswerArea.hide();
        $votingButtonHolder.show();
        // socket.emit('get voteButtons');
    }

    socket.on('enter guess phase', function (answers) {
        if (!waitingForNextRound) {
            enterGuessPhase();
        }
    });

    socket.on('get next answer', function (answer, question) {
        // console.log("Get Next Answer");
        hasVoted = false;
        var html = '<strong style="font-size:3vw">' + lang.question + ':</strong><p>' + question + '</p>';
        html += '<div style="width:100%; border:1px white solid; height:1px"></div>'
        html += '<strong style="font-size:3vw">' + lang.whoAnswered + ':</strong><h2>' + answer + '</h2>';
        $question.html(html);
        $questionArea.addClass('rotate360');
        $("#questionArea").on(
            "transitionend MSTransitionEnd webkitTransitionEnd oTransitionEnd",
            function () {
                $(this).delay(300).queue(function () {  // Wait for 1 second.
                    $(this).removeClass("rotate360").dequeue();
                });
            }
        );
        $('.voteButton').each(function(button){
            $(this).removeClass('greyButton');
            $(this).css('border-color', 'inherit');
            $(this).removeClass('blue');
        });
    });

    socket.on('username taken', function () {
        $('#userFormArea').prepend(makeErrorMsg('Username taken'))
    });

    socket.on('get notAnswerColors', function (data) {
        var html = '<ul>';
        for (var i = 0; i < data.length; i++) {
            var txt = data[i][0];
            if (txt.length > 7) {
                txt = txt.substr(0, 4) + '...';
            }
            html += '<li type="button"';
            html += 'style="cursor : pointer; background-color:' + data[i][1][0] + '"';
            html += '>' + txt + '</li>'
        }
        html += '</ul>'
        $('#hasNotAnswered').html(html);
    });

    $(document).on('click', '#sendAnswer', function (event) {
        // console.log("Send answer");
        socket.emit('send answer', username, color, $answer.val());
        socket.emit('get notAnswerColors');
        $textEnterArea.hide();
    });

    socket.on('voting reset', function () {
        hasVoted = false;
    });

    socket.on('new question', function (data) {
        $questionArea.addClass('rotate360');
        $("#questionArea").on(
            "transitionend MSTransitionEnd webkitTransitionEnd oTransitionEnd",
            function () {
                $(this).delay(300).queue(function () {  // Wait for 1 second.
                    $(this).removeClass("rotate360").dequeue();
                });
            }
        );
        $question.html('<h3>'+lang.question+':</h3><h2>' + data + '</h2>');
    });

    //
    // socket.on('new message', function (data) {
    //     $chat.append('<div class="well"><strong>' + data.user + '</strong>: ' + data.msg + '</div>');
    // });

    socket.on('get voteButtons', function (colors, users) {
        // console.log("get votebuttons", colors, users);
        if (loggedIn) {
            // if (users[0] == username) {
            //     isAdmin = true;
            // }
            var html = '';
            for (var i = 0; i < users.length; i++) {
                html += '<div type="button" class="col-xs-6 col-sm-6 col-md-4 btn btn-primary voteButton" id="' + i + '"';
                html += ' style="background-color:' + colors[i][0] + '; color: ' + colors[i][1] + ';"><div id="username-' + users[i] + '">' + users[i] + '</div>';
                html += '<div id="voteNumber-' + users[i] + '" class="col-xs-12 col-sm-12 col-md-12 voteNumber"></div>';
                html += '<div id="answer-' + users[i] + '" class="col-xs-12 col-sm-12 col-md-12 answer"></div>';
                html += '</div>'
            }
            $votingButtonHolder.html(html)
            if (isAdmin) {
                $('#adminArea').show();
            }
            $buttons = $('.voteButton');
        }
    });

    $(document).on('click', '#forceGuessPhase', function(){
       socket.emit('force guess phase')
    });

    $(document).on('click', '#nextAnswerButton', function () {
        socket.emit('get next answer');
    });

    // socket.on('get question', function(data){
    //    if(justLoggedIn){
    //        justLoggedIn = false;
    //        $question.html('<h2>' + data + '</h2>');
    //    }
    // });

    $(document).on('click', '#newRoundButton', function () {
        // console.log("hej");
        socket.emit('new round');
    });

    socket.on('new round', function () {
        enterWritePhase();
    });

    function enterWritePhase() {
        waitingForNextRound = false;
        $question.html(lang.newRound);
        $userFormArea.hide();
        $newRoundButton.hide();
        $nextAnswerButton.hide();
        $('.voteNumber').hide();
        // $('.answer').hide();
        $('#answer').val('');
        $questionArea.show();
        $buttonHolder.show();
        $textEnterArea.show();
        $ownAnswerArea.show();
        $votingButtonHolder.hide();
        socket.emit('get notAnswerColors');
        $('#waitingForRound').hide();
    }

    //User Login
    $(document).on('click', '#loginButton', function (e) {
        if ($username.val().length > 0 && color != '') {
            e.preventDefault();
            username = $username.val();
            socket.emit('new user', $username.val(), color, function (data) {
                if (data) {
                    loggedIn = true;
                }
            });
            socket.emit('get phase');
            socket.on('get phase', function (phase) {
                // console.log("phase", phase);
                if (phase == writePhase) {
                    socket.emit('get question');
                    socket.on('get question', function (data) {
                        $question.html('<h3>'+lang.question+':</h3><h2>' + data + '</h2>');
                    });
                    enterWritePhase();
                } else {
                    $userFormArea.hide();
                    waitingForNextRound = true;
                    $('.container').append('<div id="waitingForRound"><label>' + lang.waitingForNextRound + '</label></div>');
                }
            });
            $username.val('');
        } else {
            if ($username.val().length == 0) {
                $('#userFormArea').prepend(makeErrorMsg(lang.pickAName))
            }
            if (color == '') {
                $('#userFormArea').prepend(makeErrorMsg(lang.pickAColor))
            }
        }
    })

    // //User Login
    // $userForm.submit(function (e) {
    //     if ($username.val().length > 0 && color != '') {
    //         e.preventDefault();
    //         username = $username.val();
    //         socket.emit('new user', $username.val(), function (data) {
    //             if (data) {
    //                 $userFormArea.hide();
    //                 $questionArea.show();
    //             }
    //         });
    //         $username.val('');
    //     } else if($username.val().length == 0){
    //         $('#container').append(makeErrorMsg('Välj ett namn'))
    //     } else if(color == ''){
    //         // console.log("Färg")
    //         $('#container').append(makeErrorMsg('Välj en färg'))
    //     }
    // });

    function makeErrorMsg(msg) {
        return '<div class="alert alert-warning">' + msg + '</div>'
    }

    // socket.on('get users', function (data) {
    //     var html = '';
    //     for(i = 0; i < data.length; i++) {
    //         html += '<li class="list-group-item">'+data[i]+'</li>';
    //     }
    //     $users.html(html);
    // });

    socket.on('get votes', function (data) {
        $('.voteNumber').each(function (index) {
            $(this).text(data[index]);
        });
    });


    function setUpLanguage() {
        $('#chooseName').text(lang.chooseName);
        $('#chooseColor').text(lang.chooseColor);
        $('#loadingColors').text(lang.loadingColors);
        $('#nextAnswerButton').text(lang.nextAnswer);
        $('#newRoundButton').text(lang.newRound);
        $('#backButton').text(lang.goBack);
        $('#activateOwnQuestion').text(lang.writeOwnQuestion);
        $('#shuffleRandomQuestion').text(lang.randomize);
        $('#useRandomQuestionButton').text(lang.useRandom);
        $('#question').text(lang.question);
        $('#answerTheQuestion').text(lang.answerThqQuestion);
        $('.hasNotAnsweredContainer h2').text(lang.hasNotAnswered);
        $('#sendAnswer').val(lang.send);
        $('#loginButton').val(lang.next);
        $('#username').attr("placeholder", lang.name);
        $('#useOwnQuestion').attr("placeholder", lang.writeOwnQuestion);
        $('#answer').attr("placeholder", lang.writeText);
    }

    $(document).on('click', '#resetAll', function(){
       socket.emit('reset all');
    });

    function getLanguage(langChoice) {
        // var json = (function () {
        //     var json = null;
        //     $.ajax({
        //         'async': false,
        //         'global': false,
        //         'url': "../JSON/english.json",
        //         'dataType': "json",
        //         'success': function (data) {
        //             json = data;
        //         }
        //     });
        //     console.log(json);
        //     return json;
        // })();
        if (langChoice == 'en') {
            console.log("hejhej");
                lang = {
                    "answerThqQuestion": "Answer the Question",
                    "hasNotAnswered": "Has Not Answered",
                    "writeText": "Write Text...",
                    "send": "Send",
                    "randomize": "Randomize",
                    "useRandom": "Use Random",
                    "writeOwnQuestion": "Write Own Question",
                    "useQuestion": "use",
                    "goBack": "< Go Back",
                    "nextQuestion": "Next Question",
                    "nextAnswer": "Next Answer",
                    "newRound": "New Round",
                    "chooseName": "Choose Name",
                    "chooseColor": "Choose Color",
                    "loadingColors": "Loading Colors...",
                    "question":"Question",
                    "whoAnswered": "Who Said",
                    "pickAName":"Pick a name",
                    "pickAColor":"Pick a color",
                    "waitingForNextRound":"Waiting for next round",
                    "name": "Name...",
                    "next": "Next",
                    "correctGuesses" : "# of people who guessed correctly",
                    "theirAnswer": "Their answer",
                    "result":'Result',
                };
        } else {
                lang = {
                    "answerThqQuestion": "Svara på frågan",
                    "hasNotAnswered": "Har inte svarat",
                    "writeText": "Skriv text...",
                    "send": "Skicka",
                    "randomize": "Slumpa",
                    "useRandom": "Använd Slumpad",
                    "writeOwnQuestion": "Skriv egen fråga",
                    "useQuestion": "Använd",
                    "goBack": "< Tillbaka",
                    "nextQuestion": "Nästa Fråga",
                    "nextAnswer": "Nästa Svar",
                    "newRound": "Ny Omgång",
                    "chooseName": 'Välj Namn',
                    "chooseColor": "Välj färg",
                    "loadingColors": "Laddar Färger...",
                    "question":"Fråga",
                    "whoAnswered": "Vem svarade",
                    "pickAName":"Välj ett namn",
                    "pickAColor":"Välj en färg",
                    "waitingForNextRound":"Väntar på nästa runda",
                    "name": "Namn...",
                    "next": "Nästa",
                    "correctGuesses" : "Antal som gissade rätt",
                    "theirAnswer": "Deras svar",
                    "result":'Resultat',
                };
        }
    }
});