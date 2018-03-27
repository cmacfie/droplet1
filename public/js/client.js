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

    var hasVoted = false;
    var isAdmin = false;
    var username = '';

    var shuffledQuestion = '';


    $('#resetVotesButton').click(function (event) {
        socket.emit('reset votes');
    });

    $(document).on('click', '#shuffleRandomQuestion', function(event){
        socket.emit('shuffle question');
        $('#useRandomQuestionButton').addClass("notransform");
    });

    $(document).on('click', '#useRandomQuestionButton', function(event){
        if(shuffledQuestion != '') {
            socket.emit('use question', shuffledQuestion);
            $('#useRandomQuestionButton').removeClass('notransform', 300, 'linear');
        }
    });

    $(document).on('click', '#activateOwnQuestion', function(event){
        $messageArea.show();
        $buttonHolder.hide();
        $questionArea.hide();
    });

    $(document).on('click', '#backButton', function(event){
        $messageArea.hide();
        $buttonHolder.show();
        $questionArea.show();
    });

    socket.on('new shuffled question', function(data){
       shuffledQuestion = data;
       $question.html(data);
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
        console.log(this.id);
        if (!hasVoted) {
            hasVoted = true;
            socket.emit('new vote', this.id);
        }
    });

    socket.on('voting reset', function () {
        hasVoted = false;
    });

    socket.on('new question', function(data){
        console.log(data);
        $questionArea.addClass('rotate360');
        $("#questionArea").on(
            "transitionend MSTransitionEnd webkitTransitionEnd oTransitionEnd",
            function() {
                $(this).delay(300).queue(function() {  // Wait for 1 second.
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
        if (data[0] == username) {
            isAdmin = true;
        } else {
            console.log(data);
        }
        var elem = $('.votingButtonHolder');
        var html = '';
        for (var i = 0; i < data.length; i++) {
            html += '<div type="button" class="col-xs-6 col-sm-6 col-md-4 btn btn-primary voteButton" id="' + i + '"';
            html += ' style=background-color:' + colors[i % colors.length] + '><div>' + data[i] + '</div>';
            html += '<div class="col-xs-12 col-sm-12 col-md-12 voteNumber">0</div>'
            html += '</div>'
        }
        elem.html(html)
        if (isAdmin) {
            $('#adminArea').show();
        }
        $buttons = $('.voteButton');
        console.log($buttons);
    });

    $userForm.submit(function (e) {
        if ($username.val().length > 0) {
            e.preventDefault();
            username = $username.val();
            socket.emit('new user', $username.val(), function (data) {
                if (data) {
                    $userFormArea.hide();
                    $questionArea.show();
                }
            });
            $username.val('');
        }
    });

    // socket.on('get users', function (data) {
    //     var html = '';
    //     for(i = 0; i < data.length; i++) {
    //         html += '<li class="list-group-item">'+data[i]+'</li>';
    //     }
    //     $users.html(html);
    // });

    socket.on('get votes', function (data) {
        console.log("Reset", data);
        $('.voteNumber').each(function (index) {
            $(this).text(data[index]);
        });
    });

});