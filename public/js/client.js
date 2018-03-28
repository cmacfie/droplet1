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

    var hasVoted = false;
    var isAdmin = false;
    var username = '';
    var color = '';

    var loggedIn = false;

    var colors = [];
    var lastTarget;

    var shuffledQuestion = '';

    socket.emit('get colors');

    socket.on('get colors', function (data) {
        console.log(data);
        colors = data;
        var html = '<ul>';
        for (var i = 0; i < data.length; i++) {
            html += '<li class="colorSquare"'
            html += 'style="background-color:' + data[i][0] +'; color:"'+data[i][1]+ '"';
            html += '></li>'
        }
        console.log(html);
        html += '</ul>';
        $colorHolder.html(html);
    });

    console.log(makeErrorMsg('Hejhej'))

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
            $question.html(data);
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
        $question.html(data);
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
            var elem = $('.votingButtonHolder');
            var html = '';
            for (var i = 0; i < data.length; i++) {
                html += '<div type="button" class="col-xs-6 col-sm-6 col-md-4 btn btn-primary voteButton" id="' + i + '"';
                html += ' style="background-color:' + colors[i][0] + '; color: ' + colors[i][1] + '"><div>' + data[i] + '</div>';
                html += '<div class="col-xs-12 col-sm-12 col-md-12 voteNumber">0</div>'
                html += '</div>'
            }
            elem.html(html)
            if (isAdmin) {
                $('#adminArea').show();
            }
            $buttons = $('.voteButton');
        }
    });


    //User Login
    $(document).on('click', '#loginButton', function(e){
        if ($username.val().length > 0 && color != '') {
            e.preventDefault();
            username = $username.val();
            socket.emit('new user', $username.val(), color, function (data) {
                console.log(color);
                if (data) {
                    $userFormArea.hide();
                    $questionArea.show();
                    loggedIn = true;
                }
            });
            $username.val('');
        } else {
            if($username.val().length == 0){
                $('#userFormArea').prepend(makeErrorMsg('Välj ett namn'))
            }
            if(color == ''){
                console.log("Färg")
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