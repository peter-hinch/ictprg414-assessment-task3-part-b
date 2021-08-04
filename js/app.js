// document ready -------------------------------------------------------------
$(document).ready(function() {

    // if local storage is available, run processParentPin()
    // to assign a parental pin if it does not exist
    //console.log("Attempt to load settings from localStorage");

    processUserPreferences(); // refresh user preferences
    processParentPin(); // check if a pin exists

    displayHighScores(); // high scores - display high scores
    listQuestions(); // list questions

    // hide game loop, image and next button
    $("#gameLoopImageDiv").hide();
    $("#theGameLoop").hide();
    $("#highScoresButton").hide();
    $("#nextQuestionButton").hide();

    // settings - assign buttons
    $("#parent-lock-off").on('click', function(){
        window.location.href="#checkPinDialog";
    });
    
    $("#clearHighScoresButton").on('click', function(){
        resetHighScores();
    });

    $("#savePrefsButton").on('click', function(){
        savePreferences();
    });

    $("#resetPrefsButton").on('click', function(){
        resetPreferences();
    });

    // gameLoop - assign buttons
    $("#beginGameButton").on('click', function(){
        beginGame();
    });

    $("#nextQuestionButton").on('click', function(){
        nextQuestion();
    });

    $("#highScoresButton").on('click', function(){
        window.location.href="#highScores";
        window.location = window.location.href;
    });

    // high scores - assign buttons
    
    $("#playAgainButton").on('click', function(){
        window.location.href="#gameLoop";
    });

    // dialog boxes - assign radios and buttons

    // newPinDialog
    $("#btnNewPin").on('click', function(){
        setPin(pwdNewParentalPin.value);
    });
    
    // checkPinDialog
    $("#btnCheckPin").on('click', function(){
        unlockPrefsVerifyPin(pwdCheckParentalPin.value);
    });

    // highScoresDialog
    // reference: https://www.tutorialrepublic.com/faq/how-to-get-the-value-of-selected-radio-button-using-jquery.php
    $("#btnConfirmAvatar").on('click', function(){
        let radioValue = $("input[name='radio-anon-avatar']:checked").val();
        if(radioValue)
            highScoresSetName(ANONYMOUS_AVATARS[radioValue]);
    });
    $("#btnConfirmName").on('click', function(){
        highScoresSetName(txtEnterName.value);
    });

    $("#settings").on("pagebeforeshow", function(){
        processUserPreferences(); // load user preferences and apply them
        refreshPreferencesUi(); // keep ui in sync with saved settings
        processPrefLocked(); // lock unlock preferences
    }); // end of pagebeforeshow - settings

    $("#gameLoop").on("pagebeforeshow", function(){
        processUserPreferences(); // load user preferences and apply them
    }); // end of pagebeforeshow - gameLoop

    $("#highScores").on("pagebeforeshow", function(){
        processUserPreferences(); // load user preferences and apply them
    }); // end of pagebeforeshow - highScores

    $("#practice").on("pagebeforeshow", function(){
        processUserPreferences(); // load user preferences and apply them
    }); // end of pagebeforeshow - practice

}); // end of document ready

// global variables -----------------------------------------------------------

// define game length
const GAME_LENGTH = 5;

// define % of correct answers, below this is a difficult question
const DIFFICULT_QUESTION_THRESHOLD = 0.5;

// define emojis available if anonymised high scores is on
const ANONYMOUS_AVATARS = [ "\uD83D\uDC36", "\uD83D\uDC31", "\uD83D\uDC2F", "\uD83D\uDC37", "\uD83D\uDC3C"];

// flair for high scores completed with difficult questions turned on
const HIGHSCORES_FLAIR = "\u2B50";

// define default user preferences object
const DEFAULT_PREFERENCES = {
    prefLocked: "on",
    prefSlang: "on",
    prefDifficulty: "normal",
    prefUiTheme: "light",
    prefTextSize: "standard",
    prefAnonymised: "on"
};

// define the blank high scores array
var EMPTY_HIGH_SCORES = [
    {name: "", score: 0, difficulty: ""},
    {name: "", score: 0, difficulty: ""},
    {name: "", score: 0, difficulty: ""},
    {name: "", score: 0, difficulty: ""},
    {name: "", score: 0, difficulty: ""}
];

const UL_PREFIX = "<ul class='ui-listview ui-listview-inset ui-corner-all ui-shadow' data-role='listview' data-inset='true'>";
const UL_SUFFIX = "</ul>";
const UL_DIVIDER_PREFIX = "<li class='ui-li-divider' data-role='list-divider' role='heading'>";
const UL_DIVIDER_SUFFIX = "</li>";
const UL_LI_PREFIX = "<li class='ui-li-static'>";
const UL_LI_SUFFIX = "</li>";

// assign default preferences and scores to the objects we'll use
var userPreferences = DEFAULT_PREFERENCES;
var highScores = EMPTY_HIGH_SCORES;

var parentalPin = "";
var questionDifficultyStats = [];
var questionOrder;
var answerOrder;
var current = 0;
var score = 0;
var ranking;

// question bank --------------------------------------------------------------

// questions are stored as an array of objects. each object contains:
// - imgPath: path to the image in folder structure
// - answers: array of possible answers
// - correctInd: index of the correct answer in the aforementioned array
// - slang: true or false depending on whether the question is in the slang category
var questions = [
    {imgPath: "images/000.svg", answers:["Ant", "Ape", "Amp"], correctInd: 0, slang: false},
    {imgPath: "images/001.svg", answers:["Bike", "Bite", "Bait"], correctInd: 0, slang: false},
    {imgPath: "images/002.svg", answers:["Cat", "Cart", "Cape"], correctInd: 0, slang: false},
    {imgPath: "images/003.svg", answers:["Dog", "Dig", "Dam"], correctInd: 0, slang: false},
    {imgPath: "images/004.svg", answers:["Egg", "Elf", "Elbow"], correctInd: 0, slang: false},
    {imgPath: "images/005.svg", answers:["Fish", "Field", "Finger"], correctInd: 0, slang: false},
    {imgPath: "images/006.svg", answers:["Grapes", "Grab", "Grumpy"], correctInd: 0, slang: false},
    {imgPath: "images/007.svg", answers:["Happy", "Hippie", "Hippo"], correctInd: 0, slang: false},
    {imgPath: "images/008.svg", answers:["Igloo", "Into", "Iguana"], correctInd: 0, slang: false},
    {imgPath: "images/009.svg", answers:["Jam", "Jaguar", "Jump"], correctInd: 0, slang: false},
    {imgPath: "images/010.svg", answers:["Kite", "Kilt", "Kit"], correctInd: 0, slang: false},
    {imgPath: "images/011.svg", answers:["Lamp", "Lamb", "Limb"], correctInd: 0, slang: false},
    {imgPath: "images/012.svg", answers:["Map", "Melt", "Marble"], correctInd: 0, slang: false},
    {imgPath: "images/013.svg", answers:["Night", "Knight", "Nine"], correctInd: 0, slang: false},
    {imgPath: "images/014.svg", answers:["Orange", "Orangutan", "Oval"], correctInd: 0, slang: false},
    {imgPath: "images/015.svg", answers:["Pirate", "Printer", "Parrot"], correctInd: 0, slang: false},
    {imgPath: "images/016.svg", answers:["Quarter", "Quad", "Quilt"], correctInd: 0, slang: false},
    {imgPath: "images/017.svg", answers:["Rhino", "Raven", "River"], correctInd: 0, slang: false},
    {imgPath: "images/018.svg", answers:["Sad", "Soap", "Salt"], correctInd: 0, slang: false},
    {imgPath: "images/019.svg", answers:["Tiger", "Tape", "Tyre"], correctInd: 0, slang: false},
    {imgPath: "images/020.svg", answers:["Unicorn", "Unicycle", "Unique"], correctInd: 0, slang: false},
    {imgPath: "images/021.svg", answers:["Van", "Vampire", "Vine"], correctInd: 0, slang: false},
    {imgPath: "images/022.svg", answers:["Water", "Waiter", "Whisk"], correctInd: 0, slang: false},
    {imgPath: "images/023.svg", answers:["X-Ray", "Xylophone", "Axe"], correctInd: 0, slang: false},
    {imgPath: "images/024.svg", answers:["Yo-Yo", "Yolk", "Yacht"], correctInd: 0, slang: false},
    {imgPath: "images/025.svg", answers:["Zebra", "Zig-Zag", "Zoo"], correctInd: 0, slang: false},
    {imgPath: "images/026.svg", answers:["Tinnie", "Table", "Tent"], correctInd: 0, slang: true},
    {imgPath: "images/027.svg", answers:["Barbie", "Bilby", "Bingo"], correctInd: 0, slang: true},
    {imgPath: "images/028.svg", answers:["Ute", "Undies", "Umpire"], correctInd: 0, slang: true},
    {imgPath: "images/029.svg", answers:["Yabby", "Yobbo", "Yuppy"], correctInd: 0, slang: true},
];

// shared functions -----------------------------------------------------------

// uses the JavaScript Web Storage API
// the following functions test to see if localStorage is available
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
function localStorageAvailable() {
    try
    {
        let x = '__storage_test__';
        localStorage.setItem(x, x);
        localStorage.removeItem(x);
        //console.log("localStorage IS available")
        return true;
    }
    catch(e) {
        //console.log("localStorage NOT available")
    }
}

function processUserPreferences()
{
    // if there are user preferences saved in localStorage, load them in
    if( localStorageAvailable() && localStorage.getItem('userPreferences') !== null )
    {
        // parse stored string and save to userPreferences object
        userPreferences = JSON.parse(localStorage.getItem('userPreferences'));
        console.log("userPreferences loaded");
    }

    console.log({userPreferences});

    // process each user preference - TODO - possibly move to individual pages
    processPrefUiTheme();
    processPrefTextSize();
}

function processPrefLocked()
{
    // if Locked is set to "on"
    if( userPreferences.prefLocked == "on" )
    {
        //console.log("Preferences locked");
        $("input[name='radio-slang']").prop('disabled', true).checkboxradio('refresh');
        $("input[name='radio-difficulty']").prop('disabled', true).checkboxradio('refresh');
        $("input[name='radio-ui-theme']").prop('disabled', true).checkboxradio('refresh');
        $("input[name='radio-text-size']").prop('disabled', true).checkboxradio('refresh');
        $("input[name='radio-anonymised']").prop('disabled', true).checkboxradio('refresh');
        $("#clearHighScoresButton").attr('disabled', true);
        $("#resetPinButton").attr('disabled', true);
    }
    else // assume locked is "off" (default)
    {
        //console.log("Preferences unlocked");
        $("input[name='radio-slang']").prop('disabled', false).checkboxradio('refresh');
        $("input[name='radio-difficulty']").prop('disabled', false).checkboxradio('refresh');
        $("input[name='radio-ui-theme']").prop('disabled', false).checkboxradio('refresh');
        $("input[name='radio-text-size']").prop('disabled', false).checkboxradio('refresh');
        $("input[name='radio-anonymised']").prop('disabled', false).checkboxradio('refresh');
        $("#clearHighScoresButton").attr('disabled', false);
        $("#resetPinButton").attr('disabled', false);
    }
}

function processPrefUiTheme()
{
    // light and dark mode utilise the inbuilt jQuery themes 'a' and 'b' respectively
    // reference: https://stackoverflow.com/questions/7972140/jquery-mobile-change-theme-on-click

    // if uiTheme is set to "dark"
    if( userPreferences.prefUiTheme == "dark" )
    {
        // the following removing and adding of classes is necessary
        // to re-theme the page with the included "theme-b"
        $(".ui-mobile-viewport").removeClass('ui-page-theme-a').addClass('ui-page-theme-b');
        $(".ui-page-active").removeClass('ui-page-theme-a').addClass('ui-page-theme-b');
        $(".ui-page").removeClass('ui-page-theme-a').addClass('ui-page-theme-b');
        $(".ui-body").removeClass('ui-body-a').addClass('ui-body-b');
    }
    else // assume uiTheme is "light" (default)
    {
        // and the same in the opposite direction to return to original
        $(".ui-mobile-viewport").removeClass('ui-page-theme-b').addClass('ui-page-theme-a');
        $(".ui-page-active").removeClass('ui-page-theme-b').addClass('ui-page-theme-a');
        $(".ui-page").removeClass('ui-page-theme-b').addClass('ui-page-theme-a');
        $(".ui-body").removeClass('ui-body-b').addClass('ui-body-a');
    }
}

function processPrefTextSize()
{
    // if textSize is set to "large" (relevant text classes x= 1.2)
    if( userPreferences.prefTextSize == "large" )
    {
        $('body').css({"font-size":"19.2px"});
        $('button').css({"font-size":"19.2px"});
        $('legend').css({"font-size":"19.2px"});
        $('label').css({"font-size":"19.2px"});
        $('.ui-mini').css({"font-size":"15px"});
        $('.ui-toolbar-back-btn').css({"font-size":"15px"});
    }
    else // assume textSize is "standard" (default)
    {
        $('body').css({"font-size":"16px"});
        $('button').css({"font-size":"16px"});
        $('legend').css({"font-size":"16px"});
        $('label').css({"font-size":"16px"});
        $('.ui-mini').css({"font-size":"12.5px"});
        $('.ui-toolbar-back-btn').css({"font-size":"12.5px"});
    }
}

function refreshPreferencesUi()
{
    //console.log("calling function refreshPreferencesUi");
    
    // deselect ALL radio buttons
    // reference: https://stackoverflow.com/questions/977137/how-to-reset-radiobuttons-in-jquery-so-that-none-is-checked
    $("input[name='radio-parent-lock']").prop('checked', false).checkboxradio('refresh');
    $("input[name='radio-slang']").prop('checked', false).checkboxradio('refresh');
    $("input[name='radio-difficulty']").prop('checked', false).checkboxradio('refresh');
    $("input[name='radio-ui-theme']").prop('checked', false).checkboxradio('refresh');
    $("input[name='radio-text-size']").prop('checked', false).checkboxradio('refresh');
    $("input[name='radio-anonymised']").prop('checked', false).checkboxradio('refresh');
    
    // reselect the radio buttons for current settings
    $("#parent-lock-" + userPreferences.prefLocked).prop('checked', true).checkboxradio('refresh');
    $("#aussie-slang-" + userPreferences.prefSlang).prop('checked', true).checkboxradio('refresh');
    $("#difficulty-" + userPreferences.prefDifficulty).prop('checked', true).checkboxradio('refresh');
    $("#ui-theme-" + userPreferences.prefUiTheme).prop('checked', true).checkboxradio('refresh');
    $("#text-size-" + userPreferences.prefTextSize).prop('checked', true).checkboxradio('refresh');
    $("#anonymised-" + userPreferences.prefAnonymised).prop('checked', true).checkboxradio('refresh');
}

// attempt to load saved settings from localStorage using the Web Storage API
function processParentPin()
{
    if ( localStorageAvailable() && (localStorage.getItem('parentalPin') != null) )
    {
        // attempt to load the 'parentalPin' key pair from localStorage
        // if it exists, assign it to the parentalPin global variable
        parentalPin = localStorage.getItem('parentalPin');
        console.log("'parentalPin' " + parentalPin + " loaded from localStorage");
    }
    else
    {
        // if the 'parentalPin' key pair is not yet stored, open the Create PIN dialog
        console.log("unable to find a value for 'parentalPin' in localStorage");
        window.location.href="#newPinDialog";
        
        // fill prompt and description
        document.getElementById("pinPrompt").innerHTML = "Please choose a four"
            + " digit Parental PIN:";
        document.getElementById("pinDesc").innerHTML = "Certain settings in this"
            + " app can only be changed by a parent who knows the PIN. Please" 
            + " see the settings page for more information.";
    }
}

function checkParentPin()
{
    if ( localStorageAvailable() && !localStorage.getItem('parentalPin') )
    {
        window.location.href="#checkPinDialog";
        // fill prompt and description
        document.getElementById("pinPrompt").innerHTML = "Please enter Parental PIN:";
        document.getElementById("pinDesc").innerHTML = "";
        
    }
}

// newPinDialog ---------------------------------------------------------------
// dialog box

// checks input for pwdNewParentalPin against regex for 4 digits,
function validatePin()
{
    var pinRegExp = /^\d{4}$/;
    let pin = document.getElementById("pwdNewParentalPin").value;
    let str = "";

    if (pinRegExp.test(pin) == true)
    {
        str = "Valid PIN entered";
        document.getElementById("outputNewPinDialog").innerHTML = str;
        return true;
    }
    else
    {
        str = "Please enter a 4 digit PIN";
        document.getElementById("outputNewPinDialog").innerHTML = str;
        return false;
    }
}

// uses input from pwdNewParentalPin and saves the new PIN if it passes validation
function setPin(newPin)
{
    if ( localStorageAvailable() && (validatePin() === true) )
    {
        localStorage.setItem('parentalPin', newPin);
        console.log("parentalPin set to " + newPin);
        $(".newPinDialog").dialog("close");
        window.location.href="#settings";
    }
}

// checkPinDialog -------------------------------------------------------------
// dialog box

// checks input for pwdCheckParentalPin against pin in localStorage
function unlockPrefsVerifyPin(checkPin)
{
    document.getElementById("pwdCheckParentalPin").value = "";
    
    if( localStorageAvailable() && localStorage.getItem('parentalPin') )
    {
        if( checkPin == localStorage.getItem('parentalPin') )
        {
            console.log("Pin entered, '" + checkPin + "' IS correct");
            
            $("input[name='radio-parent-lock']").prop('checked', false).checkboxradio('refresh');
            $("#parent-lock-off").prop('checked', true).checkboxradio('refresh');
            savePreferences();

            $(".checkPinDialog").dialog("close");
            window.location.href="#settings";
        }
        else
        {
            console.log("Pin entered, '" + checkPin + "' is NOT correct");

            document.getElementById("outputCheckPinDialog").value = "Incorrect PIN entered";
            document.getElementById("pwdCheckParentalPin").focus();
        }
    }
}

// gameLoop -------------------------------------------------------------------

function shortlistIncludeSlang(bool)
{
    // this function creates a shortlist with or without Aussie slang questions
    let slangQuestionsFiltered = [];
    
    for( let i in questions ) // iterate to find slang questions
    {
        // if true, add all questions including slang
        if( bool == true )
            slangQuestionsFiltered.push(i); 
        // if false, only add non slang questions
        else if( (bool == false) && (questions[i].slang == false) )
            slangQuestionsFiltered.push(i);
    }

    return slangQuestionsFiltered;
}

function orderShuffled(array)
{
    // this shuffle utilises the Fisher Yates method to randomise elements
    // reference: https://bost.ocks.org/mike/shuffle/
    // reference: https://www.w3schools.com/js/js_array_sort.asp
    let i, j, k;

    for( i = array.length -1 ; i > 0 ; i-- )
    {
        j = Math.floor(Math.random() * i);
        k = array[i];
        array[i] = array[j];
        array[j] = k;
    }
    return array;
}

// show questions with correctRatio below DIFFICULT_QUESTION_THRESHOLD first
function orderHardestToEasiest(array)
{
    // load in the saved statistics
    loadQuestionDifficultyStats();
    
    // find questions in the array that have stats saved 
    for( let i = 0 ; i < array.length ; i++ )
    {
        for( let j = 0 ; j < questionDifficultyStats.length ; j++ )
        {
            if( (questionDifficultyStats[j].index == i) &&
                (questionDifficultyStats[j].correctRatio <= DIFFICULT_QUESTION_THRESHOLD) )
            {
                console.log("Question " + i + " is difficult (correctRatio is " + questionDifficultyStats[j].correctRatio + ")");
                // remove the question from its original index
                array.splice(i, 1);
                // add that question back to the beginning of the array
                array.unshift(questionDifficultyStats[j].index);
            }    
        }
    }
    return array;
}

function shortenToGameLength(array)
{
    // copies the first elements from an array until the GAME_LENGTH is reached
    let finalQuestions = array.slice(0, GAME_LENGTH); // up to but not including game length
    return finalQuestions;
}

function randomSequence(length, range)
{
    // creates an array of unique randomised number objects 
    let sequence = new Array(length);
    let rand = Math.round(Math.random() * range);

    range = new Number(range);

    for( let i = 0 ; i < length ; i++ )
    {
        do{
            rand = Math.floor(Math.random() * range); // using floor() allows zero
        }while( sequence.indexOf(rand) != -1 ); // indexOf() returns -1 when value is not found
        sequence[i] = rand;
    }

    return sequence;
}

function beginGame()
{
    let questionShortlist = [];
    
    // check if user preference is to include Aussie slang or not
    if( userPreferences.prefSlang == "on" )
        questionShortlist = shortlistIncludeSlang(true);
    else
        questionShortlist = shortlistIncludeSlang(false);

    // shuffle the shortlisted questions
    orderShuffled(questionShortlist);
    
    // if the hard difficulty setting is selected, show questions with
    // correctRatio below DIFFICULT_QUESTION_THRESHOLD first
    if( userPreferences.prefDifficulty == "hard" )
        questionShortlist = orderHardestToEasiest(questionShortlist);
    
    // shorten questionShorlist to the GAME_LENGTH and assign as questionOrder
    // to begin the gameLoop
    questionOrder = shortenToGameLength(questionShortlist);
    //console.log(questionOrder);

    score = 0;

    nextQuestion(); // call next question to display first question

    $("#gameLoopImageDiv").show(); // hide the question image
    $("#theGameLoop").show(); // show the game part of the page
    $("#beginGameButton").hide(); // hide the start button
    $("#highScoresButton").hide(); // hide the high scores button
    $("#nextQuestionButton").hide(); // hide the next question button
}

function nextQuestion()
{
    $("#nextQuestionButton").hide(); // hide the next question button
    
    if( current < questionOrder.length )
    {
        // hide the answer options
        $("#theGameLoop").show(); // hide the game part of the page

        // enable radio buttons
        // reference: https://learn.jquery.com/using-jquery-core/faq/how-do-i-disable-enable-a-form-element/
        $("#radAnsA").prop( "disabled", false ).checkboxradio('refresh');
        $("#radAnsB").prop( "disabled", false ).checkboxradio('refresh');
        $("#radAnsC").prop( "disabled", false ).checkboxradio('refresh');
    
        // used randomSequence(length, range) to randomise the sequence available answers
        // in this function, it is assumed all questions have the same number of possible answers
        answerOrder = randomSequence(questions[0].answers.length, questions[0].answers.length); 
    
        // remove previous feedback
        document.getElementById("outputGameLoop").innerHTML = "&nbsp;";
    
        // display image for question
        $("#questionImage").attr("src",questions[questionOrder[current]].imgPath);
    
        // clear all radio buttons
        $("#radAnsA").prop('checked', false).checkboxradio('refresh');
        $("#radAnsB").prop('checked', false).checkboxradio('refresh');
        $("#radAnsC").prop('checked', false).checkboxradio('refresh');

        // populate radio button labels and values with answers for question in random order
        $("label[for=radAnsA]").html( questions[questionOrder[current]].answers[answerOrder[0]] );
        $("#radAnsA").attr("value", answerOrder[0] );
    
        $("label[for=radAnsB]").html( questions[questionOrder[current]].answers[answerOrder[1]] );
        $("#radAnsB").attr("value", answerOrder[1] );
    
        $("label[for=radAnsC]").html( questions[questionOrder[current]].answers[answerOrder[2]] );
        $("#radAnsC").attr("value", answerOrder[2] );
    
    }
    else
    {
        document.getElementById("outputGameLoop").innerHTML = "Game over! You scored: " + score;
        processHighScores(score);
        current = 0;
        $("#gameLoopImageDiv").hide(); // hide the question image
        $("#theGameLoop").hide(); // hide the game part of the page
        $("#highScoresButton").show(); // show the high scores button
        $("#beginGameButton").show(); // show the start button
    }
}

function checkAnswer(value)
{
    // hide the answer options
    $("#theGameLoop").hide(); // hide the game part of the page
    
    if( value == questions[questionOrder[current]].correctInd ) // correct answer
    {
        score++;
        //console.log("score is: " + score);
        document.getElementById("outputGameLoop").innerHTML = "Well done<br />"
            + questions[questionOrder[current]].answers[questions[questionOrder[current]].correctInd] + "<br />is correct!";
        saveQuestionDifficultyStats(questionOrder[current], true);
    }
    else
    {
        document.getElementById("outputGameLoop").innerHTML = "Nice try, but<br />"
            + questions[questionOrder[current]].answers[questions[questionOrder[current]].correctInd] + "<br />was the correct answer";
        saveQuestionDifficultyStats(questionOrder[current], false);
    }
    
    
    $("#nextQuestionButton").show(); // show the next question button

    current++;
}

function loadQuestionDifficultyStats()
{
    // if there are user difficulty stats in localStorage, load them in
    if( localStorageAvailable() && localStorage.getItem('savedQuestionDifficultyStats') !== null )
    {
        // parse stored string and save to userPreferences object
        questionDifficultyStats = JSON.parse(localStorage.getItem('savedQuestionDifficultyStats'));
        console.log("Question difficulty statistics loaded.");
    }
}

function saveQuestionDifficultyStats(questionIndex, correctBoolean)
{
    // this function keeps track of how frequently questions are answered correctly
    let flagFound = false; // flag for searching if a record exists
    
    for( let i in questionDifficultyStats ) // iterate through questionDifficultyStats[]
    {
        if( questionDifficultyStats[i].index == questionIndex ) // if a record exists
        {
            questionDifficultyStats[i].askedCount++; // increment the askedCount value for this question
            flagFound = true; // set the flag for found to true

            // if answered correctly, increment the correctCount for this question
            if ( correctBoolean == true)
                questionDifficultyStats[i].correctCount++;
            
            // calculate ratio of correct answers
            questionDifficultyStats[i].correctRatio = questionDifficultyStats[i].correctCount / questionDifficultyStats[i].askedCount;
        }
    }

    // if the question does not yet have a record, create one
    if( (flagFound == false) && (correctBoolean == true) ) // case if correctly answered
        questionDifficultyStats.push({index: questionIndex, askedCount: 1, correctCount: 1, correctRatio: 1});
    if( (flagFound == false) && (correctBoolean == false) ) // case if incorrectly answered
        questionDifficultyStats.push({index: questionIndex, askedCount: 1, correctCount: 0, correctRatio: 0});

    //console.log({questionDifficultyStats});

    if ( localStorageAvailable() )
    {
        localStorage.setItem('savedQuestionDifficultyStats', JSON.stringify(questionDifficultyStats) );
        console.log("Question difficulty statistics saved.");
    }
    else
    {
        console.log("Unable to save difficulty statistics.");
    }
}

function processHighScores(newScore)
{
    //console.log("Processing high scores");
    
    ranking = highScores.length + 1; // ranking is not a high score by default
    
    // as the array stores scores in descending order, iterate from end to beginning
    for( i = highScores.length-1 ; i >= 0 ; i-- )
    {
        // check to see if newScore is greater than existing score at this index
        if( newScore > highScores[i].score )
            ranking = i;
    }

    // if the ranking is high enough to place in the high scores, add it to the
    // array. identical scores are ranked below existing scores of the same value
    if( ranking < highScores.length )
    {
        // open the highScoresDialog for name entry / selection of avatar
        highScoresEntry();
    }
}

// highScoresDialog -----------------------------------------------------------
// dialog box

function highScoresEntry()
{
    // if anonymised high scores are off, prompt for name
    if( userPreferences.prefAnonymised == "off")
    {
        // show text input and hide avatar selection
        $("#highScoresNames").show();
        $("#highScoresAvatars").hide();

        // open dialog box
        window.location.href="#highScoresDialog";
    }
    else // assume anonymised high scores are on (default)
    {
        // load in anonymous avatar emojis from global variable
        for( let i in ANONYMOUS_AVATARS )
            $("label[for=anon-avatar-" + i + "]").html(ANONYMOUS_AVATARS[i]);
         
        // hide text input and show avatar selection    
        $("#highScoresNames").hide();
        $("#highScoresAvatars").show();

        // open dialog box
        window.location.href="#highScoresDialog";
    }
}

function highScoresSetName(user)
{
    //console.log(user);
    
    // user is passed to this function from the 
    highScores.splice(ranking, 0, {name: user, score: score, difficulty: userPreferences.prefDifficulty});
    highScores.pop();

    if ( localStorageAvailable() )
    {
        //console.log("High scores saved.");
        localStorage.setItem("highScores", JSON.stringify(highScores));
    }

    // display high scores and reload for most recent score
    window.location.href="#highScores";
    window.location.reload();
}

// high scores ----------------------------------------------------------------

function displayHighScores()
{
    let flairEmoji = "";
    let str = UL_PREFIX + UL_DIVIDER_PREFIX + "High Scores" + UL_DIVIDER_SUFFIX;

    if( localStorageAvailable() && localStorage.getItem("highScores") )
    {
        highScores = JSON.parse(localStorage.getItem("highScores"));
  
        for( i = 0 ; i < highScores.length ; i++ )
            if(highScores[i].score != 0)
            {
                if(highScores[i].difficulty == "hard")
                    flairEmoji = " " + HIGHSCORES_FLAIR;
                else
                    flairEmoji = "";
                
                str += UL_LI_PREFIX + (i + 1) + ". " + highScores[i].name + " - "
                + highScores[i].score + flairEmoji + UL_LI_SUFFIX;
            }
            str += UL_DIVIDER_PREFIX + "Note: stars shown for scores achieved in hard mode" + UL_DIVIDER_SUFFIX + UL_SUFFIX;
    }
    else if( localStorageAvailable() && !localStorage.getItem("highScores") )
    {
        str += UL_LI_PREFIX + "No High Scores Yet!" + UL_LI_SUFFIX + UL_SUFFIX;
    }

    document.getElementById("outputHighScores").innerHTML = str;
}

// practice -------------------------------------------------------------------

function listQuestions()
{
    let str = UL_PREFIX + UL_DIVIDER_PREFIX + "All Questions" + UL_DIVIDER_SUFFIX;

    for ( i = 0 ; i < questions.length ; i++ )
    {
        str += UL_LI_PREFIX
            + "<img src='" + questions[i].imgPath + "' alt='"+ questions[i].answers[questions[i].correctInd] + "' class='practice-img' />"
            + "<h2>" + questions[i].answers[questions[i].correctInd] + "</h2>"
            + UL_LI_SUFFIX
    }
    str += UL_SUFFIX;   
    document.getElementById("outputPractice").innerHTML = str;
}

// settings -------------------------------------------------------------------

function savePreferences()
{
    // get values for radio buttons
    // reference: https://stackoverflow.com/questions/596351/how-can-i-know-which-radio-button-is-selected-via-jquery
    let userPrefsLocked = $("input[name='radio-parent-lock']:checked").val();
    let userSlang = $("input[name='radio-slang']:checked").val();
    let userDifficulty = $("input[name='radio-difficulty']:checked").val();
    let userUiTheme = $("input[name='radio-ui-theme']:checked").val();
    let userTextSize = $("input[name='radio-text-size']:checked").val();
    let userAnonymised = $("input[name='radio-anonymised']:checked").val();

    if( localStorageAvailable )
    {
        // store user preferences in an object
        userPreferences = {
            prefLocked: userPrefsLocked, prefSlang: userSlang,
            prefDifficulty: userDifficulty, prefUiTheme: userUiTheme,
            prefTextSize: userTextSize, prefAnonymised: userAnonymised
        }
        // save the preferences object to localStorage (must be converted to string)
        localStorage.setItem('userPreferences', JSON.stringify(userPreferences) );
        console.log("Preferences saved");
    }
    else
        console.log("Unable to save user preferences");

    processUserPreferences();
    processPrefLocked(); // lock unlock preferences
}

function resetHighScores()
{
    if( localStorageAvailable )
    {
        // remove the preferences object from localStorage
        localStorage.removeItem('highScores');
        
        // revert user preferences back to default object
        highScores = EMPTY_HIGH_SCORES;

        console.log("High scores erased");
    }
    else
        console.log("Unable to clear high scores");
}

function resetPreferences()
{
    if( localStorageAvailable )
    {
        // remove the preferences object from localStorage
        localStorage.removeItem('userPreferences');
        
        // revert user preferences back to default object
        userPreferences = DEFAULT_PREFERENCES;
        // update radio buttons to match
        refreshPreferencesUi();
        console.log("Preferences cleared");
    }
    else
        console.log("Unable to clear user preferences");

    processUserPreferences(); // load user preferences and apply them
    processPrefLocked(); // lock unlock preferences
}
