from flask_restful import Resource, reqparse
from models.topic import TopicModel

class Topic(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument(
        'topic_id',
        type=int,
        required=True,
        help='An error occurred - \'topic_id\' was empty'
    )
    parser.add_argument('is_unlocked', type=bool)
    parser.add_argument('name', type=str)
    parser.add_argument('needed_credit', type=int)

    def get(self):
        request_data = Topic.parser.parse_args()

        try:
            topic = TopicModel.find_by_id(request_data['topic_id'])
        except:
            return {'message': 'An error occurred while reading the topic ID from the database'}, 500

        if topic:
            return topic.json()
        return {'message': 'Topic with the ID {} not found'.format(request_data['topic_id'])}, 404

    def put(self):
        request_data = Topic.parser.parse_args()

        try:
            topic = TopicModel.find_by_id(request_data['topic_id'])

            if not topic:
                topic = TopicModel(
                    request_data['topic_id'],
                    request_data['is_unlocked'],
                    request_data['name'],
                    request_data['needed_credit']
                )
            else: # if 'topic' is defined, this means there's an existing record under this ID, so update it with the values we have
                if request_data['topic_id'] != None:
                    topic.topic_id = request_data['topic_id']
                
                if request_data['is_unlocked'] != None:
                    topic.is_unlocked = request_data['is_unlocked']
                
                if request_data['name'] != None:
                    topic.name = request_data['name']
                
                if request_data['needed_credit'] != None:
                    topic.needed_credit = request_data['needed_credit']
        except:
            return {'message': 'An error occurred while reading the topic ID from the database'}, 500

        try:
            topic.save_to_database()
            return topic.json()
        except:
            return {'message': 'An error occurred while updating the topic in the database'}, 500
    
    def delete(self):
        request_data = TopicModel.parser.parse_args()

        try:
            topic = TopicModel.find_by_id(request_data['topic_id'])

            if topic:
                topic.delete_from_database()

            return {'message': 'Topic with ID {} deleted.'.format(request_data['topic_id'])}
        except:
            return {'message': 'An error occurred while reading the topic ID from the database'}, 500

class Topics(Resource):
    def get(self):
        try:
            return {'topics': [t.json() for t in TopicModel.get_all()]}
        except:
            return {'message': 'An error occurred while reading all of the topics from the database'}, 500
