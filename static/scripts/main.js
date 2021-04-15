const mainImage = document.getElementsByClassName('main-img');

window.onload = () => {
    stateHandler.shouldHideHeader();
    
    if (mainImage != null && mainImage.length > 0) { //if there is a dominant image in the page, add the 'window.onscroll()' event listener
        window.onscroll = () => {
            stateHandler.shouldHideHeader();
        }
    }
}

stateHandler = {
    shouldHideHeader: () => {
        if(mainImage != null && mainImage.length > 0) { //we need to check this here also as 'window.onload()' will run this method separately
            if (events.isOnScreen(mainImage[0])) //hide the dominant navbar elements if there is a main background image visible - we only do this for the first one as ones lower down in the page would cause the nav bar to hide when the image isn't filling the whole page
                stateHandler.modifyHeader(0, 'var(--transparent)');
            else
                stateHandler.modifyHeader(100, 'var(--header-gradient)');
        }
        else
            stateHandler.modifyHeader(100, 'var(--header-gradient)');
    },

    modifyHeader: (opacity, background) => {
        $('#logo').css({
            'opacity': opacity
        });
        $('#page-header').css({
            'background-image': `${background}`
        });
    }
}

events = {
    isOnScreen: (element) => { //used to determine if an HTML element is on screen - https://stackoverflow.com/a/5354536/11136104
		var rect = element.getBoundingClientRect();
		var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
		return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
	},

    navOperationClicked: (display) => { //this parameter used to be 'operation', which determined whether we are opening or closing the navigation menu via animation
        $('#nav-menu').css({
            'display': display
            //'animation': `${operation}-mobile-nav 0.5s ease forwards`
        });
    }
}

request = {
    /* endpoint - the resource you want to get data from (a list of available resources are available at the bottom of 'app.py')
     * method - the type of request you want to make
     * extension - any additional information the resource may need - if you looked in 'app.py' you'll see that some of them need an ID: this is where the ID is specified
     * data - this is basically an extension but with more information: you send the API a JavaScript object with the attributes needed, for example "{ topic_id: 2 }" at the endpoint "/topics" to get the topic with an ID of '2'
     * handler - this is the function you want to use your data from the back end in, for example: 'request.listTopics' creates HTML elements dynamically for every topic's name and buttons that take the user to that topic's tests
     */
    ajax: ({endpoint=null, method="GET", extension=null, data=null, handler=null}={}) => { //defaults to a "GET" request as this is used most frequently
        $.ajax({
            url: extension === null ? `${endpoint}` : `${endpoint}/${extension}`,
            method: method,
            data: data,
            async: true,
            success: (servedData) => {
                if(handler != null && servedData != null) //if we got data from the backend and we have something to do with it
                    handler(servedData); //handler is the method (based on the parameter) that used the data from this request
            }
        });
    }
}

requestHandlers = {
    listTopics: (data) => {
        //data for the side panel
        var sidePanelData = [];
        //the credits value of the unlocked topics
        var neededCredits = 0;
        var gainedCredits = 0;
        //the progress of the successfully completed tests in the unlocked topics
        var maxProgress = 0;
        var gainedProgress = 0;

        if(data != null) {
            for(let i = 0; i < data.topics.length; i++) {
                const topic = data.topics[i];
                var topicsCredit = 0;

                //get the required/needed credit from the topic (if the topic is unlocked)
                neededCredits = topic.is_unlocked == 1 ? neededCredits + Number(topic.needed_credit) : neededCredits;

                //this topic's container in the menu
                var topicItem = elemUtils.createElement({type: 'div', className: "topic-item", parent: document.getElementById('topics-menu')})

                //the element in the container which displays this topic's name
                elemUtils.createElement({type: 'b', className: "topic-name", innerHTML: topic.name, parent: topicItem});

                //the line in the container that separates the name and buttons
                elemUtils.createElement({type: 'div', className: "topics-line", parent: topicItem});

                //the container, in this topic's container, which contains the buttons
                var topicItemLevels = elemUtils.createElement({type: 'div', className: "topic-levels", parent: topicItem});
                
                //for every test in this topic, add a button to the button container for it
                for(let j = 0; j < topic.tests.length; j++) {
                    //var that holds the index (j) if there is a newly unlocked test - to be displayed as unlocked
                    var newUnlockedTest = null;
                    // unlock a locked test if the previous test was passed
                    if (topic.is_unlocked == 1 && j != 0 && topic.tests[j].is_unlocked == 0) { //the first test shoul be always unlocked before hand
                        if (topic.tests[j-1].gained_credit >=topic.tests[j-1].pass_credit) {
                            request.ajax({
                                endpoint: 'tests',
                                method: 'PUT',
                                data: {
                                    test_id: topic.tests[j].test_id,
                                    is_unlocked: 1
                                },
                                handler: console.log
                            });
                            newUnlockedTest = j;
                        }
                    }

                    // if the topic is unlocked count gained credits and the progress made
                    if (topic.is_unlocked == 1) {
                        gainedCredits = gainedCredits + topic.tests[j].gained_credit;

                        gainedProgress = topic.tests[j].gained_credit >= topic.tests[j].pass_credit ? 
                            gainedProgress + 1 : gainedProgress;
                        maxProgress = maxProgress + 1;
                    }

                    //calculate the credit for the topic
                    topicsCredit = topicsCredit + topic.tests[j].gained_credit;

                    //the test button
                    var topicItemLevel;
                    //if the topic is unlocked and the test is unlocked display the test unlocked
                    if (topic.is_unlocked == 1 && topic.tests[j].is_unlocked == 1 || newUnlockedTest==j) {
                        //if the test was completed successfully show a tick
                        if (topic.tests[j].gained_credit >= topic.tests[j].pass_credit)
                        {
                            topicItemLevel = elemUtils.createElement({type: 'button', className: "level-button small-icon-button-padding", parent: topicItemLevels});
                            var lockIcon = elemUtils.createElement({type: 'span', className: "material-icons success-test-icon small-icon-button", innerHTML: 'done_outline', parent: topicItemLevel});
                            lockIcon.setAttribute('data-test_id', topic.tests[j].test_id); 
                        }
                        else {
                            topicItemLevel = elemUtils.createElement({type: 'button', className: "level-button", innerHTML: j + 1, parent: topicItemLevels});
                        }
                    }
                    else {                        
                        topicItemLevel = elemUtils.createElement({type: 'button', className: "level-button small-icon-button-padding", parent: topicItemLevels});
                        var lockIcon = elemUtils.createElement({type: 'span', className: "material-icons small-icon-button", innerHTML: 'lock', parent: topicItemLevel});
                        
                        topicItemLevel.setAttribute('disabled', true);
                        lockIcon.style = 'font-size: 18px;';
                    }

                    //attributes for the button
                    topicItemLevel.setAttribute('id', String('test-button-' + topic.tests[j].test_id));
                    topicItemLevel.setAttribute('data-test_id', topic.tests[j].test_id); //store the ID of the test in which this button relates to

                    //save data for the side panel
                    sidePanelData.push([
                        String(topic.name + ': ' + Number(j+1)), //TODO the test number should be order_num
                        topic.tests[j].time_limit===null ? 'No limit' : String(topic.tests[j].time_limit),
                        topic.tests[j].is_retakeable===1 ? 'No limit' : 'No retakes',
                        topic.tests[j].gained_credit,
                        topic.tests[j].max_credit,
                        topic.tests[j].description
                    ]);

                    //when the button is clicked
                    topicItemLevel.addEventListener("click", (event) => { //'event' is used to get the HTML element which this event is attached to
                        //if the testID exists change the colour back to the original colour
                        if (storageUtils.getSessionValue(storageUtils.testID)!=null) {
                            document.getElementById(String('test-button-' + storageUtils.getSessionValue(storageUtils.testID))).style = "background-color: var(--dark);"
                        }
                        storageUtils.storeSessionValue(storageUtils.testID, event.target.getAttribute('data-test_id')); //get the ID and store it in the session so it's carried over to 'quiz-page'
                        document.getElementById(String('test-button-' + topic.tests[j].test_id)).style = "background-color: var(--darker);";
                        document.getElementById("side-panel").style.visibility = "visible";
                        //send data to the side panel
                        elemUtils.displaySidePanel(sidePanelData[event.target.getAttribute('data-test_id')-1]);
                    });
                }
                //list the formative assessments for the topic
                for(let k = 0; k < topic.formative_assessments.length; k++) {
                    // if the topic is unlocked count gained credits and the progress made
                    if (topic.is_unlocked == 1) {
                        gainedCredits = gainedCredits + topic.formative_assessments[k].gained_credit;

                        gainedProgress = topic.formative_assessments[k].gained_credit >= topic.formative_assessments[k].pass_credit ? 
                            gainedProgress + 1 : gainedProgress;
                        maxProgress = maxProgress + 1;
                    }

                    //calculate the credit for the topic
                    topicsCredit = topicsCredit + topic.formative_assessments[k].gained_credit;

                    var fa_button;
                    //if the topic is unlocked and the fa is unlocked display the fa unlocked
                    if (topic.is_unlocked == 1 && topic.formative_assessments[k].is_unlocked == 1) {
                        //if the fa was completed successfully show a tick
                        if (topic.formative_assessments[k].is_marked && topic.formative_assessments[k].gained_credit >= topic.formative_assessments[k].pass_credit)
                        {
                            fa_button = elemUtils.createElement({type: 'button', className: "fa-button small-icon-button-padding", parent: topicItemLevels});
                            var lockIcon = elemUtils.createElement({type: 'span', className: "material-icons success-fa-icon small-icon-button", innerHTML: 'done_outline', parent: fa_button});
                            lockIcon.setAttribute('data-fa_id', topic.formative_assessments[k].fa_id);
                        }
                        //if the fa is failed show cross
                        else if (topic.formative_assessments[k].is_marked && topic.formative_assessments[k].gained_credit < topic.formative_assessments[k].pass_credit) {
                            fa_button = elemUtils.createElement({type: 'button', className: "fa-button small-icon-button-padding", parent: topicItemLevels});
                            var lockIcon = elemUtils.createElement({type: 'span', className: "material-icons success-fa-icon small-icon-button", innerHTML: 'close', parent: fa_button});
                            lockIcon.setAttribute('data-fa_id', topic.formative_assessments[k].fa_id);
                        }
                        //if the fa has an answer show hourglass
                        else if (topic.formative_assessments[k].answer != null && topic.formative_assessments[k].answer != '') {
                            fa_button = elemUtils.createElement({type: 'button', className: "fa-button small-icon-button-padding", parent: topicItemLevels});
                            var lockIcon = elemUtils.createElement({type: 'span', className: "material-icons success-fa-icon small-icon-button", innerHTML: 'hourglass_full', parent: fa_button});
                            lockIcon.setAttribute('data-fa_id', topic.formative_assessments[k].fa_id);
                        }
                        else {
                            fa_button = elemUtils.createElement({type: 'button', className: "fa-button", innerHTML: k + 1, parent: topicItemLevels});
                        }
                    }
                    else {                        
                        fa_button = elemUtils.createElement({type: 'button', className: "fa-button small-icon-button-padding", parent: topicItemLevels});
                        var lockIcon = elemUtils.createElement({type: 'span', className: "material-icons small-icon-button", innerHTML: 'lock', parent: fa_button});
                        
                        fa_button.setAttribute('disabled', true);
                        lockIcon.style = 'font-size: 18px;';
                    }
                    //set the attribute
                    fa_button.setAttribute('data-fa_id', topic.formative_assessments[k].fa_id);
                
                    //when the button is clicked
                    fa_button.addEventListener("click", (event) => {
                        storageUtils.storeSessionValue(storageUtils.faID, event.target.getAttribute('data-fa_id'));
                        window.location.href = Flask.url_for('formativeAssessment')
                    });
                
                }
                //if user's gained credit is over the needed credit for the topic display a tick
                if (topicsCredit >= topic.needed_credit) {
                    var successBadge = elemUtils.createElement({type: 'span', className: "level-button material-icons", innerHTML: 'verified', parent: topicItemLevels});
                    successBadge.style = 'color: var(--correctGreen);';
                }
            }
            //set progress made
            var progressPerc = Math.round(gainedProgress / maxProgress * 100);
            document.getElementById('tests-menu-progress').innerHTML = String(progressPerc + '%');
            //set credits gained
            document.getElementById('tests-menu-credits').innerHTML = String(gainedCredits + '/' + neededCredits);
        }
    },

    displayTest: (data) => {
        storageUtils.storeSessionValue(storageUtils.testDataID, data);
        quiz.length = data.quizzes.length;

        const navbar = document.getElementById('quizzes-navigation');
        for(let i = 0; i < quiz.length; i++) { //for each question in the quiz, create a button for each of them which we can use to navigate to a specific question 
            var navButton = elemUtils.createElement({type: 'button', className: "level-button", innerHTML: i + 1, parent: navbar});

            navButton.setAttribute('data-quiz_id', i + 1); //give this button an attribute which stores the ID of the question it should take the user to
            navButton.addEventListener("click", (event) => {
                const newQuestion = parseInt(event.target.getAttribute('data-quiz_id'));

                if(!isNaN(newQuestion) && !quiz.viewedInfoPages.includes(newQuestion)) { //don't navigate to this button's page if it is an info page
                    quiz.previousQuestion = quiz.currentQuestion;
                    quiz.currentQuestion = newQuestion;
                    quiz.navigateToQuestion();

                    //update the appropriate elements based on the new question number (back button availability and continue button style)
                    elemUtils.checkBackButton();
                    elemUtils.checkContinueButton();
                }
            });
        }

        if(data.quizzes != null && quiz.length > 0) {
            data.quizzes.forEach((question) => {
                if(question.quiz_type === "info")
                    quiz.infoPagesCount++;
            });
            quiz.loadQuestion(quiz.findNextQuestion(data.quizzes, 1));
        }
        else 
            throw Error(`There are no questions available for the test with ID ${data.test_id}`);
    },

    recordUserAnswersAndEnd: (data) => {
        var selectedIDs = [];
        var gainedCredits = 0;
        var test = storageUtils.getSessionValue(storageUtils.testDataID);
        
        quiz.selectedAnswers.forEach((answerRecord) => { //create a list of the IDs of answers that the user selected
            selectedIDs.push(answerRecord.answer_id);
        })

        test.quizzes.forEach((question) => { //we need to search through every question to check which answers have been selected - if an answer hasn't been selected, we still need to change it's answer to 'false' in case it's been set to 'true' by a previous attempt of this test
            var quizCredits = 0;
            question.answers.forEach((answer) => {
                var isSelectedID = selectedIDs.includes(answer.answer_id);

                if((answer.is_selected && !isSelectedID) || (!answer.is_selected && isSelectedID)) //prevents PUT requests being made to the back end (for this answer) if there are no changes to be made to 'is_selected'
                    request.ajax({
                        endpoint: 'answers',
                        method: 'PUT',
                        data: {
                            answer_id: answer.answer_id,
                            is_selected: isSelectedID ? true : null //reqparse in Flask doesn't recognise 'false' as 0, I'm assuming this is because it sees 'is_selected' is defined and thinks it's therefore 'true'
                        },
                        handler: console.log //in case there is a bad request, log the details explaining why
                    });
                
                // if the selected answer is correct add its credits to the gained credits total
                if (isSelectedID && data.correctAnswers.includes(answer.answer_id)) {
                    gainedCredits = gainedCredits + Number(question.credit_value);
                    quizCredits = Number(question.credit_value);
                }
            });
            
            request.ajax({
                endpoint: 'quizzes',
                method: 'PUT',
                data: {
                    quiz_id: question.quiz_id,
                    gained_credit: quizCredits
                },
                handler: console.log //in case there is a bad request, log the details explaining why
            });
        });

        // save the credit score of the whole test
        request.ajax({
            endpoint: 'tests',
            method: 'PUT',
            data: {
                test_id: test.test_id,
                gained_credit: gainedCredits
            },
            handler: console.log //in case there is a bad request, log the details explaining why
        });

        storageUtils.removeSessionValue(storageUtils.testDataID); //delete the quiz data from storage
        setTimeout(() => {window.location.href = Flask.url_for('testresult')}, 800);
        //window.location.href = Flask.url_for('testresult') //TODO: because user redirection has been moved to after the requests have been made, is it now safe to not use a timeout? After a couple of tests it seems to be safe, but it's not been tested enough
    },

    displayResults: (data) => {
		const answersFeedback = document.getElementById('results-feedback-answers');

		//score calcualtions
		var gainedCredits = 0;
		var	correctAnswersAmount = 0;
		var questionsAmount = 0;

		data.quizzes.forEach((quiz) => {
			//if this is a multiple choice quiz display it
			if(quiz.quiz_type === 'multiple_choice'){
				questionsAmount = questionsAmount + 1;

				//row with the question with a break row bellow
				elemUtils.createElement({type: 'div', className: 'row', innerHTML: String(quiz.order_num + ') ' + quiz.text_body), parent: answersFeedback});
				elemUtils.createElement({type: 'br', parent: answersFeedback}); 
				var answersSection = elemUtils.createElement({type: 'div', className: 'column quiz-radio-section', parent: answersFeedback});
				quiz.answers.forEach((answer) => {
					var answerSection = elemUtils.createElement({type: 'div', className: 'quiz-radio-row feedback-answer', parent: answersSection});
					
					//select the right way to display the answer - correct = green, wrong = red, else = grey
					if (answer.is_correct) {
						elemUtils.createElement({type: 'span', className: 'material-icons quiz-radio-btn', innerHTML: 'check_circle_outline', parent: answerSection});
						answerSection.style = 'color: var(--correctGreen);';
					}
					else if ((!answer.is_correct) && answer.is_selected) {
						elemUtils.createElement({type: 'span', className: 'material-icons quiz-radio-btn', innerHTML: 'highlight_off', parent: answerSection});
						answerSection.style = 'color: var(--wrongRed);';
					}
					else {
						elemUtils.createElement({type: 'span', className: 'material-icons quiz-radio-btn', innerHTML: 'radio_button_unchecked', parent: answerSection});
					}

					//if the answer is correct add the amount of credits gained at the end of the line
					if (answer.is_correct && answer.is_selected) {
						elemUtils.createElement({type: 'label', innerHTML: String(answer.body + ' &nbsp;&nbsp;(+' + quiz.credit_value + ' credits)'), parent: answerSection});
						gainedCredits = gainedCredits + quiz.credit_value;
						correctAnswersAmount = correctAnswersAmount + 1;
					}
					else {
						elemUtils.createElement({type: 'label', innerHTML: answer.body, parent: answerSection});
					}

				});
				elemUtils.createElement({type: 'br', parent: answersFeedback}); 
			}
		});

		//display final scores
		var percScore = (gainedCredits / data.max_credit * 100).toFixed(2);

		if (gainedCredits >= data.pass_credit) {
			document.getElementById('test-results-passing').innerHTML = String('You have gotten ' + percScore +'% correct and passed');
			document.getElementById('test-results-passing').style = 'color: var(--correctGreen);';
		}
		else {
			document.getElementById('test-results-passing').innerHTML = String('You have gotten ' + percScore +'% correct and failed');
			document.getElementById('test-results-passing').style = 'color: var(--wrongRed);';
		}
		
		document.getElementById('test-results-correct-answers').innerHTML = 'Correct answers: '+ correctAnswersAmount + '/' + questionsAmount;
		document.getElementById('test-results-total-gained-credits').innerHTML = String('You have gained ' + gainedCredits + '/' + data.max_credit + ' credits');
		if (data.time_limit!=null) {
			document.getElementById('test-results-timelimit-left').innerHTML = 'You had ' + data.time_limit + 'mins left';
		}
	},
    displayFA: (data) => {
        //reset the form
        document.getElementById('fa-choose-btn').removeAttribute('disabled');
        document.getElementById('fa-choose-btn').style = '';
        document.getElementById('fa-result').style = "display: none;";
        document.getElementById('fa-submit-btn').removeAttribute('disabled');
        document.getElementById('fa-submit-btn').style = '';
        document.getElementById('fa-comment-section').style = 'display: none;';

        //display FA info
        document.getElementById('fa-title').innerHTML = data.title;
        document.getElementById('fa-instructions').innerHTML = data.instructions;
        document.getElementById('fa-credits').innerHTML = String('Credits: ' + data.gained_credit + '/' + data.max_credit);
        document.getElementById('fa-deadline').innerHTML = String('Deadline: ' + data.deadline);
        
        //display vid or image
        var attachment = document.getElementById('fa-img');
        var visualName; // the placeholder for the split name of the attachment - to know if it's a vid or img

        //if there is a attachment and if it's a video assign attachment to it
        if (data.path_to_attachment != null) {
            visualName = data.path_to_attachment.split('//');
            attachment = visualName[0] == 'https:' ? document.getElementById('fa-vid') : attachment;
        }
        
        if(data.path_to_attachment != null) {
            if(visualName[0] == 'https:') {
                // assign the vid element
                attachment.src = data.path_to_attachment;
                attachment.parentElement.style.display = "block";
                attachment.style = "";
                // reset the img element
                document.getElementById('fa-img').style.display = "none";
                document.getElementById('fa-img').src = "";
            }
            else {
                // assign the img element
                attachment.src = Flask.url_for('static', {'filename': `images/fa/${data.path_to_attachment}`});
                attachment.parentElement.style.display = "block";
                attachment.style = "";
                // reset the vid element
                document.getElementById('fa-vid').style.display = "none";
                document.getElementById('fa-vid').src = "";
            }
        }
        else if(attachment != null) {
            //clean all elements
            document.getElementById('fa-vid').src = "";
            document.getElementById('fa-vid').style.display = "none";
            document.getElementById('fa-img').src = ""; //delete the image if it is not needed
            document.getElementById('fa-img').style.display = "none";
            document.getElementById('fa-img').parentElement.style.display = "none"; //also, hide it's container so it's not occupying space on the page
        }

        document.getElementById('fa-answer').innerHTML = data.answer;

        //if the document is submitted and not marked yet
        if (data.answer != '' && !data.is_marked) {
            document.getElementById('fa-result').innerHTML = 'Waiting for feedback...';
        }

        //get today's date to compare it to the deadline
        var today = new Date();
        var split_deadline = data.deadline.split('/');
        var month = split_deadline[1].length == 1 ? '0' + String(split_deadline[1]) : split_deadline[1];
        var day = split_deadline[0].length == 1 ? '0' + String(split_deadline[0]) : split_deadline[0];
        var converted_deadline = String(split_deadline[2] + '-' + month + '-' + day);
        var deadline_date = new Date(converted_deadline);

        //after the deadline disable the buttons to submit new files
        if(deadline_date.getTime() < today.getTime()) {
            document.getElementById('fa-choose-btn').setAttribute('disabled', true);
            document.getElementById('fa-choose-btn').style = 'color: var(--light); background-color: var(--less-dark);';
            document.getElementById('fa-submit-btn').setAttribute('disabled', true);
            document.getElementById('fa-submit-btn').style = 'background-color: var(--less-dark)'
        }

        if(data.answer != '') {
            document.getElementById('fa-result').style = '';
        }

        //if it's marked
        if (data.is_marked) {
            document.getElementById('fa-comment').innerHTML = data.reviewer_comment;
            document.getElementById('fa-comment-section').style = '';

            if (data.gained_credit >= data.pass_credit) {
                document.getElementById('fa-result').style = 'color: var(--correctGreen)';
                document.getElementById('fa-result').innerHTML = 'Passed';
            }
            else {
                document.getElementById('fa-result').style = 'color: var(--wrongRed)';
                document.getElementById('fa-result').innerHTML = 'Failed';
            }
        }
    }
}

quiz = {
    length: null,
    currentQuestion: 1,
    previousQuestion: null,
    infoPagesCount: 0, //used to deduct the info pages from the length of the quiz - for the progress bar
    viewedInfoPages: [], //stores info pages (by order_num) that have been viewed
    selectedAnswers: [], //stores the history of the user's selected answers, in the format "{question: x, answer: y}"

    navigateToQuestion: ({isFinish=false}={}) => { //navigates to question number 'quiz.currentQuestion'
        const data = storageUtils.getSessionValue(storageUtils.testDataID);
        const questions = data.quizzes;

        if(quiz.previousQuestion != null && questions[quiz.previousQuestion - 1].answers.length > 0) { //if the last question was an info page (i.e. there were no answers available) then don't try to record one
            quiz.recordAnswer(questions[quiz.previousQuestion - 1].answers[0].quiz_type);
            elemUtils.updateProgressBar(quiz.length, quiz.selectedAnswers.length);
        }
        else
            elemUtils.updateInfoBtnInQuizNav(quiz.previousQuestion - 1);

        if(!isFinish)
            quiz.loadQuestion(quiz.findNextQuestion(data.quizzes));
    },

    findNextQuestion: (questions) => { //questions in the list may be out of order so we need to find them in order (it's be more efficient to just sort the list based on 'question.order_num', but I haven't implemented that yet)
        for(let i = 0; i < quiz.length; i++) {
            var question = questions[i];
            
            if(question.order_num === quiz.currentQuestion) {
                if(question.quiz_type === "info") { //if the current question is an info page...
                    if(quiz.viewedInfoPages.includes(quiz.currentQuestion)) { //... that has been viewed, load the next/previous question of this one
                        quiz.previousQuestion > quiz.currentQuestion ? quiz.currentQuestion-- : quiz.currentQuestion++; // previous is > current if the user clicked "Back", otherwise they clicked continue: this is used to change which question to load
                        i = 0; //we're now going to search for a different order number so restart the search
                        continue;
                    }
                    else //... that hasn't been viewed, add the order_num of this info page to the list of viewed info pages
                        quiz.viewedInfoPages.push(quiz.currentQuestion);
                }
                elemUtils.updateQuizNav(quiz.currentQuestion - 1, quiz.previousQuestion - 1);
                return question;
            }
        }
    },

    recordAnswer: (buttonsName) => {
        const radioButtons = document.getElementsByName(buttonsName);

        for(let i = 0; i < radioButtons.length; i++) {
            if(radioButtons[i].checked) {
                for(let j = 0; j < quiz.selectedAnswers.length; j++) { //check if we already have a recorded answer for the previous question; if we do, update it
                    if(quiz.selectedAnswers[j].question === quiz.previousQuestion) {
                        quiz.selectedAnswers[j].answer = i;
                        quiz.selectedAnswers[j].answer_id = parseInt(radioButtons[i].value);
                        return;
                    }
                }
        
                quiz.selectedAnswers.push({ //if we don't have a previously recorded answer for this question, record this one at 'i'
                    question: quiz.previousQuestion,
                    answer: i,
                    answer_id: parseInt(radioButtons[i].value)
                });
                return;
            }
        }

        /* this is redundant: the user currently cannot click a radio button to remove their answer, so this check is useless for now - unless this feature is ever implemented
        for(let i = 0; i < quiz.selectedAnswers.length; i++) { //if we reach this point then that means no answer was selected by the user, so check if there was an answer recorded for the previous question because we'll need to delete it
            if(quiz.selectedAnswers[i].question === quiz.previousQuestion) {
                quiz.selectedAnswers.splice(quiz.selectedAnswers.indexOf(i), 1);
                return;
            }
        }*/
    },

    loadQuestion: (question) => {
        if(question !== null) {
            //update all the constant HTML elements
            document.getElementById('quiz-title').innerHTML = question.title;
            document.getElementById('quiz-instructions').innerHTML = question.instructions;
            document.getElementById('quiz-text').innerHTML = question.text_body;

            var attachment = document.getElementById('quiz-img');
            var visualName; // the placeholder for the split name of the attachment - to know if it's a vid or img

            //if there is a attachment and if it's a video assign attachment to it
            if (question.path_to_attachment != null) {
                visualName = question.path_to_attachment.split('//');
                attachment = visualName[0] == 'https:' ? document.getElementById('quiz-vid') : attachment;
            }
            
            if(question.path_to_attachment != null) {
                if(visualName[0] == 'https:') {
                    // assign the vid element
                    attachment.src = question.path_to_attachment;
                    attachment.parentElement.style.display = "block";
                    attachment.style = "";
                    // reset the img element
                    document.getElementById('quiz-img').style.display = "none";
                    document.getElementById('quiz-img').src = "";
                }
                else {
                    // assign the img element
                    attachment.src = Flask.url_for('static', {'filename': `images/quiz/${question.path_to_attachment}`});
                    attachment.parentElement.style.display = "block";
                    attachment.style = "";
                    // reset the vid element
                    document.getElementById('quiz-vid').style.display = "none";
                    document.getElementById('quiz-vid').src = "";
                }
            }
            else if(attachment != null) {
                //clean all elements
                document.getElementById('quiz-vid').src = "";
                document.getElementById('quiz-vid').style.display = "none";
                document.getElementById('quiz-img').src = ""; //delete the image if it is not needed
                document.getElementById('quiz-img').style.display = "none";
                document.getElementById('quiz-img').parentElement.style.display = "none"; //also, hide it's container so it's not occupying space on the page
            }

            const answersSection = document.getElementById('quiz-radio-section');
            while(answersSection.hasChildNodes()) //remove all the answers from the answers section
                answersSection.removeChild(answersSection.firstChild);

            if(question.answers != null && question.answers.length > 0) {
                var previousAnswer = null;
                for(let i = 0; i < quiz.selectedAnswers.length; i++) //if an answer for this question has been previously selected, we need to re-select it
                    if(quiz.selectedAnswers[i].question === quiz.currentQuestion)
                        previousAnswer = quiz.selectedAnswers[i].answer;

                for(let i = 0; i < question.answers.length; i++) { //list all the available answers for this question
                    const answer = question.answers[i];

                    var answerContainer = elemUtils.createElement({type: 'div', className: "row quiz-radio-row", parent: answersSection});

                    //creates a radio button
                    var answerButton = elemUtils.createElement({type: 'input', className: "quiz-radio-btn", parent: answerContainer});
                    answerButton.type = 'radio';
                    answerButton.id = answer.answer_id;
                    answerButton.name = answer.type;
                    answerButton.value = answer.answer_id;
                    answerButton.checked = i === previousAnswer; //if there is a previously selected answer in this list of answers - and it's the one we're currently creating on the page - check it's radio button

                    //creates a lable which corresponds to the radio button created above
                    var buttonLabel = elemUtils.createElement({type: 'label', innerHTML: answer.body, parent: answerContainer});
                    buttonLabel.htmlFor = answer.answer_id;
                }
                answersSection.style.display = "flex";
            }
            else
                answersSection.style.display = "none";

            elemUtils.checkBackButton();
            elemUtils.checkContinueButton();
        }
        else 
            throw Error('There was no question specified');
    }
}

elemUtils = {
    /* only use 'createElement' if you need to create elements dynamically, otherwise you should still make elements in the HTML page
     * type - the type of HTML tag you want to use, for example: 'div'
     * className - the class of the element; use this so you can still apply CSS styling to the tag (if you want to specify an ID, you can still do that manually after creating an element with this)
     * innerHTML - use this to set the text of, for example, an 'h1' tag
     * parent - this is the container of the element you're creating, for example: if you want to place a button in a div, get the div (by using "document.getElementById", or something) and setting 'parent' as the element you just acquired
     */
    createElement: ({type, className=null, innerHTML=null, parent=null}={}) => {
        var element = document.createElement(type);

        if(className != null)
            element.className = className;
        
        if(innerHTML != null)
            element.innerHTML = innerHTML;
        
        if(parent != null) //parent generally shouldn't equal null, otherwise it will be appended to the bottom of the body
            parent.appendChild(element);

        return element
    },

    checkBackButton: () => {
        const backContainer = document.getElementsByClassName('quiz-back-space')[0];
        if(quiz.currentQuestion !== 1) {
            if(backContainer.children.length === 0) {
                var backButton = elemUtils.createElement({type: 'button', className: "quiz-btn", innerHTML: "Back", parent: backContainer});

                backButton.addEventListener("click", () => {
                    if(--quiz.currentQuestion < 1) //prevents the number from going out of bounds - take away 1 then, if it is lower than the minimum (1), add 1, otherwise use the number with 1 subtracted
                        ++quiz.currentQuestion;
                    else
                        quiz.previousQuestion = quiz.currentQuestion + 1;

                    quiz.navigateToQuestion();
                });
            }
        }
        else if(backContainer.children.length > 0)
            backContainer.removeChild(backContainer.children[0]); //there will only ever be 1 child: the button
    },

    checkContinueButton: () => {
        const continueContainer = document.getElementsByClassName('quiz-continue-space')[0];
        var continueButton;

        if(continueContainer.children.length === 0) {
            continueButton = elemUtils.createElement({type: 'button', innerHTML: "Continue", parent: continueContainer});

            continueButton.addEventListener("click", () => {
                if(continueButton.className === "quiz-finish-btn") {
                    //this is only done so we can record the user's answer to the last question
                    quiz.previousQuestion = quiz.currentQuestion;
                    quiz.navigateToQuestion({isFinish: true});

                    request.ajax({
                        endpoint:'/tests',
                        extension: 'correctAnswers',
                        method: 'GET',
                        data: {test_id: storageUtils.getSessionValue(storageUtils.testID)},
                        handler: requestHandlers.recordUserAnswersAndEnd}
                    )
                }
                else {
                    if(++quiz.currentQuestion > quiz.length) //same as the 'if' statement in 'elemUtils.checkBackButton()', but inverse
                        --quiz.currentQuestion;
                    else
                        quiz.previousQuestion = quiz.currentQuestion - 1;

                    quiz.navigateToQuestion();
                }
            });
        }
        else
            continueButton = continueContainer.children[0];

        if(quiz.currentQuestion === quiz.length) { //change the class and innerHTML of the button to signify the change in the button's operation more clearly
            continueButton.innerHTML = "Finish";
            continueButton.className = "quiz-finish-btn";
        }
        else {
            continueButton.innerHTML = "Continue";
            continueButton.className = "quiz-btn";
        }
    },
    
    displaySidePanel: (data) => {
        document.getElementById('side-panel-title').innerHTML = data[0];
        document.getElementById('side-panel-timelimit').innerHTML = data[1];
        document.getElementById('side-panel-retakeable').innerHTML = data[2];
        document.getElementById('side-panel-credits').innerHTML = String(data[3]+ '/' + data[4]);
        document.getElementById('side-panel-description').innerHTML =  data[5];

        //calculate how many stars to display
        var score = Number(data[3]/data[4]) * 100;

        document.getElementById('side-panel-star1').style = "color: var(--darkest); font-size: 60px;"
        document.getElementById('side-panel-star2').style = "color: var(--darkest); font-size: 80px;"
        document.getElementById('side-panel-star3').style = "color: var(--darkest); font-size: 60px;"

        if (score>=30) {
            document.getElementById('side-panel-star1').style = "color: var(--accent); font-size: 60px;"
            if (score>=60) {
                document.getElementById('side-panel-star2').style = "color: var(--accent); font-size: 80px;"
                if (score>=90)
                    document.getElementById('side-panel-star3').style = "color: var(--accent); font-size: 60px;"
            }
        }
    },

    updateQuizNav: (currentChild, previousChild) => {
        const nav = document.getElementById('quizzes-navigation');

        if(nav.children[currentChild] != null)
            nav.children[currentChild].style = "background-color: var(--darkest);";

        if(nav.children[previousChild] != null)
            nav.children[previousChild].style = "color: #FFFFFF;";
    },

    updateInfoBtnInQuizNav: (child) => {
        const nav = document.getElementById('quizzes-navigation');

        nav.children[child].innerHTML = '';
        elemUtils.createElement({type: 'span', className: 'material-icons quiz-nav-info-btn', innerHTML: 'close', parent: nav.children[child]});
        nav.children[child].setAttribute('disabled', true);
    },

    updateProgressBar: (maxProgress, currentProgress) => {
        const percent = Math.round(currentProgress/(maxProgress - quiz.infoPagesCount) * 100);
        
        $('#progress-bar-content').css({
            'width': `${percent}%`
        });
        document.getElementById('progress-percent').innerHTML = `${percent}%`;
    }
}

storageUtils = { //only session storage is implemented here as we do not have a need to store anything persistently in local
    //key words which identify data that will be placed in storage
    testID: "test_id",
    testDataID: "test_data",
    faID: "fa_id",

    isObject: (obj) => { //credit - https://attacomsian.com/blog/javascript-check-variable-is-object
        return Object.prototype.toString.call(obj) === '[object Object]';
    },

    storeSessionValue: (name, value) => {
        try { //tries to store the data in temporary storage
            if(name != null && typeof name === "string" && value != null) {
                window.sessionStorage.setItem(name, storageUtils.isObject(value) ? JSON.stringify(value) : value); //JavaScript objects cannot be stored so we need to convert it to a JSON
                return true;
            }
            else
                throw Error('Invalid storage name or null name/value');
        }
        catch (e) {
            //checks if storage didn't fail because it is full (returns true if it did) - the oly other reason it would fail is if storage is made unavailable
            return e instanceof DOMException && (
                   e.code === 22 ||
                   e.code === 1014 ||
                   e.name === 'QuotaExceededError' ||
                   e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
                   storage.length !== 0;
        }
    },

    getSessionValue: (name) => {
        try {
            var value = window.sessionStorage.getItem(name);
            try {
                return JSON.parse(value); //because we need to serilize an object, we also need to convert it from JSON back to an object
            }
            catch {
                return value;
            }
        }
        catch(e) {
            return null;
        }
    },
    
    removeSessionValue: (name) => {
        try {
            if(window.sessionStorage.getItem(name) != null) {
                window.sessionStorage.removeItem(name);
                return true;
            }
            throw Error(`Item \"${name}\" does not exist in local storage`);
        }
        catch(e) {
            return false;
        }
    }
}

functions = {
    startQuiz() {
        window.location.href = Flask.url_for('quiz_page');
    },

    closeSidepanel() {
        document.getElementById(String('test-button-' + storageUtils.getSessionValue(storageUtils.testID))).style = "background-color: var(--dark);"
        document.getElementById("side-panel").style.visibility = "hidden";
    },
    goToTestsMenu() {
        window.location.href = Flask.url_for('testmenu');
    },
    submitFa() {
    },
    chooseFaFile() {
    }
}