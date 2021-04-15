from flask import Flask, render_template
from flask_restful import Api
from flask_jsglue import JSGlue
from database import database
from resources.topic import Topic, Topics
from resources.formativeAssessment import FormativeAssessment
from resources.test import Test, TestCorrectAnswers
from resources.quiz import Quiz
from resources.answer import Answer
import os, test

app = Flask(__name__)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///database.db')
api = Api(app)
jsglue = JSGlue(app)
database.init_app(app)

@app.before_first_request
def create_tables():
	# if the database file already exists, don't recreate it
	if not os.path.isfile('database.db'):
		database.create_all()

	# if the data of the first insert (of 'instert_queries' in database.py) doesn't exist in the table, the test data hasn't been inserted yet, so insert it
	from models.topic import TopicModel
	if not TopicModel.query.first(): # prevent "UNIQUE constraint violation" of primary keys: this will only work as long as a topic is the first thing being inserted (you could fix this by checking every table is empty, but: a. unless you need something to be inserted before a topic there's no reason to rearrange it, and b. this is just test data so this won't be used in release)
		test.insert_test_data()
		database.session.commit()

@app.route('/')
def index():
	return render_template('home.html')

@app.route('/file-system')
def filesystem():
	return render_template('file-system.html')

@app.route('/login')
def login():
	return render_template('login.html')

@app.route('/register')
def register():
	return render_template('register.html')

@app.route('/quiz')
def quiz_page():
	return render_template('quiz-page.html')

@app.route('/test-result')
def testresult():
	return render_template('test-result.html')

@app.route('/tests-test')
def testtest():
	return render_template('tests-testing.html')

@app.route('/test-menu')
def testmenu():
	return render_template('tests-menu.html')

@app.route('/formative-assessment')
def formativeAssessment():
	return render_template('formative-assessment.html')

@app.route('/forum')
def forum():
	return render_template('forum.html')

@app.route('/my-account')
def myaccount():
	return render_template('my-account.html')

api.add_resource(Topic, '/topics')
api.add_resource(Topics, '/topics/all')
api.add_resource(FormativeAssessment, '/formativeAssessments')
api.add_resource(Test, '/tests')
api.add_resource(TestCorrectAnswers, '/tests/correctAnswers')
api.add_resource(Quiz, '/quizzes')
api.add_resource(Answer, '/answers')

if __name__ == "__main__":
	app.run(host='127.0.0.1', debug=True)