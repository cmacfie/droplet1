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

    var hasVoted = false;
    var isAdmin = false;
    var username = '';
    var color = '';

    var loggedIn = false;

    var justLoggedIn = true;

    var colors = [];
    var lastTarget;

    var shuffledQuestion = '';



    socket.emit('get colors');

    socket.on('get colors', function (data) {
        console.log(data);
        colors = data;
        var html = '<ul>';
        for (var i = 0; i < data.length; i++) {
            html += '<li type="button" class="colorSquare"'
            html += 'style="cursor : pointer; background-color:' + data[i][0] +'; color:"'+data[i][1]+ '"';
            html += '></li>'
        }
        if(!loggedIn && data.indexOf(color) == -1){
            color = '';
        }
        html += '</ul>';
        $('#loadingColors').hide();
        $colorHolder.html(html);
    });

    $(document).on('click', '#disonnectAll', function(){
       socket.emit('disconnect all');
    });

    $(document).on('click', '.colorSquare', function(event){
        if(lastTarget != undefined){
            lastTarget.css({'opacity':'', 'border':''})
        }
        lastTarget = $(event.target);
        color = colors[$('.colorSquare').index(this)];
        $(event.target).css({'opacity':'1', 'border':'2px white solid'});
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
            $question.html('<h2>'+data+'</h2>');
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
        }
    });

    $(document).on('click', '#activateAdmin', function(event){
        if($('#adminArea').is(':visible')){
            $('#adminArea').hide();
        } else {
            $('#adminArea').show();
        }
    })

    socket.on('enter result phase', function(users, answers, votes){
        $nextAnswerButton.hide();
        $newRoundButton.show();
        $question.html('<h1 style="font-size:60px">Resultat</h1>');
        console.log(users, answers, votes);
        for(i = 0; i < users.length; i++){
            $('#username-' + users[i]).html(users[i])
            $('#voteNumber-' + users[i]).html(answers[i])
            $('#answer-' + users[i]).html(votes[i])
        }
        $('.voteNumber').show();
        $('.answer').show();
    });

    socket.on('enter guess phase', function(answers){
        $buttonHolder.hide();
        $nextAnswerButton.show();
        $ownAnswerArea.hide();
        $votingButtonHolder.show();
    });

    socket.on('get next answer', function(answer, question){
        console.log("Get Next Answer");
        hasVoted = false;
        var html = '<strong style="font-size:15px">Fråga:</strong><p>' + question + '</p>';
        html+= '<h3>Vem svarade:</h3><h2>' + answer + '</h2>';
       $question.html(html);
    });

    socket.on('get notAnswerColors', function(data){
        var html = '<ul>';
        for (var i = 0; i < data.length; i++) {
            var txt = data[i][0];
            if(txt.length > 7){
                txt = txt.substr(0,4) + '...';
            }
            html += '<li type="button"';
            html += 'style="cursor : pointer; background-color:' + data[i][1][0] + '"';
            html += '>' + txt + '</li>'
        }
        html += '</ul>'
        $('#hasAnswered').html(html);
    });

    $(document).on('click', '#sendAnswer', function(event){
       console.log("Send answer");
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
        $question.html('<h2>'+data+'</h2>');
    });

    //
    // socket.on('new message', function (data) {
    //     $chat.append('<div class="well"><strong>' + data.user + '</strong>: ' + data.msg + '</div>');
    // });

    socket.on('get voteButtons', function (colors, data) {
        console.log(colors);
        if(loggedIn) {
            if (data[0] == username) {
                isAdmin = true;
            }
            var html = '';
            for (var i = 0; i < data.length; i++) {
                html += '<div type="button" class="col-xs-6 col-sm-6 col-md-4 btn btn-primary voteButton" id="' + i + '"';
                html += ' style="background-color:' + colors[i][0] + '; color: ' + colors[i][1] + '"><div id="username-'+data[i]+'">' + data[i] + '</div>';
                html += '<div id="voteNumber-'+data[i]+'" class="col-xs-12 col-sm-12 col-md-12 voteNumber"></div>';
                html += '<div id="answer-'+data[i]+'" class="col-xs-12 col-sm-12 col-md-12 answer"></div>';
                html += '</div>'
            }
            $votingButtonHolder.html(html)
            if (isAdmin) {
                $('#adminArea').show();
            }
            $buttons = $('.voteButton');
        }
    });

    $(document).on('click', '#nextAnswerButton', function(){
       socket.emit('get next answer');
    });

    socket.on('get question', function(data){
       if(justLoggedIn){
           justLoggedIn = false;
           $question.html('<h2>' + data + '</h2>');
       }
    });

    $(document).on('click', '#newRoundButton', function(){
        console.log("hej");
       socket.emit('new round');
    });

    socket.on('new round', function(){
        console.log("dfdfd")
       enterWritePhase();
    });

    function enterWritePhase(){
        $question.html('Ny Omgång')
        $userFormArea.hide();
        $newRoundButton.hide();
        $nextAnswerButton.hide();
        $('.voteNumber').hide();
        $('.answer').hide();
        $questionArea.show();
        $buttonHolder.show();
        $textEnterArea.show();
        $ownAnswerArea.show();
        $votingButtonHolder.hide();
        socket.emit('get notAnswerColors');
    }

    //User Login
    $(document).on('click', '#loginButton', function(e){
        if ($username.val().length > 0 && color != '') {
            e.preventDefault();
            username = $username.val();
            socket.emit('new user', $username.val(), color, function (data) {
                if (data) {
                    loggedIn = true;
                    socket.emit('get question');
                    enterWritePhase();
                }
            });
            $username.val('');
        } else {
            if($username.val().length == 0){
                $('#userFormArea').prepend(makeErrorMsg('Välj ett namn'))
            }
            if(color == ''){
                $('#userFormArea').prepend(makeErrorMsg('Välj en färg'))
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
    //         console.log("Färg")
    //         $('#container').append(makeErrorMsg('Välj en färg'))
    //     }
    // });

    function makeErrorMsg(msg){
        return '<div class="alert alert-warning">'+msg+'</div>'
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

});