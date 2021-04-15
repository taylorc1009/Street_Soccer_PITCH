from flask_restful import Resource, reqparse
from models.quiz import QuizModel

class Quiz(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument(
        'quiz_id',
        type=int,
        required=True,
        help='An error occurred - \'quiz_id\' was empty'
    )
    parser.add_argument('test_id', type=int)
    parser.add_argument('order_num', type=int)
    parser.add_argument('credit_value', type=int)
    parser.add_argument('gained_credit', type=int)
    parser.add_argument('quiz_type', type=str)
    parser.add_argument('text_body', type=str)
    parser.add_argument('path_to_attachment', type=str)
    parser.add_argument('title', type=str)
    parser.add_argument('instructions', type=str)

    def get(self):
        request_data = Quiz.parser.parse_args()

        try:
            quiz = QuizModel.find_by_id(request_data['quiz_id'])
        except:
            return {'message': 'An error occurred while reading the quiz ID from the database'}, 500
        
        if quiz:
            return quiz.json()
        return {'message': 'Quiz with the ID {} not found'.format(request_data['quiz_id'])}, 404
    
    def put(self):
        request_data = Quiz.parser.parse_args()

        try:
            quiz = QuizModel.find_by_id(request_data['quiz_id'])

            if not quiz:
                quiz = QuizModel(
                    request_data['quiz_id'],
                    request_data['test_id'],
                    request_data['order_num'],
                    request_data['credit_value'],
                    request_data['gained_credit'],
                    request_data['quiz_type'],
                    request_data['text_body'],
                    request_data['path_to_attachment'],
                    request_data['title'],
                    request_data['instructions']
                )
            else: # if 'quiz' is defined, this means there's an existing record under this ID, so update it with the values we have
                if request_data['quiz_id'] != None:
                    quiz.quiz_id = request_data['quiz_id']
                
                if request_data['test_id'] != None:
                    quiz.test_id = request_data['test_id']
                
                if request_data['order_num'] != None:
                    quiz.order_num = request_data['order_num']
                
                if request_data['credit_value'] != None:
                    quiz.credit_value = request_data['credit_value']
                
                if request_data['gained_credit'] != None:
                    quiz.gained_credit = request_data['gained_credit']
                
                if request_data['quiz_type'] != None:
                    quiz.quiz_type = request_data['quiz_type']
                
                if request_data['text_body'] != None:
                    quiz.text_body = request_data['text_body']
                
                if request_data['path_to_attachment'] != None:
                    quiz.path_to_attachment = request_data['path_to_attachment']
                
                if request_data['title'] != None:
                    quiz.title = request_data['title']
                
                if request_data['instructions'] != None:
                    quiz.instructions = request_data['instructions']
        except:
            return {'message': 'An error occurred while reading the quiz ID from the database'}, 500

        try:
            quiz.save_to_database()
            return quiz.json()
        except:
            return {'message': 'An error occurred while updating the quiz in the database'}, 500
    
    def delete(self):
        request_data = QuizModel.parser.parse_args()

        try:
            quiz = QuizModel.find_by_id(request_data['quiz_id'])

            if quiz:
                quiz.delete_from_database()

            return {'message': 'Quiz with ID {} deleted.'.format(request_data['quiz_id'])}
        except:
            return {'message': 'An error occurred while reading the quiz ID from the database'}, 500
