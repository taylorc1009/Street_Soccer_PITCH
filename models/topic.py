from database import database

class TopicModel(database.Model):
    __tablename__ = 'topics'

    topic_id = database.Column(database.Integer, primary_key=True, nullable=False)
    is_unlocked = database.Column(database.Boolean, nullable=False)
    name = database.Column(database.String(50), nullable=False)
    needed_credit = database.Column(database.Integer)

    tests = database.relationship('TestModel', lazy='dynamic')
    formativeAssessments = database.relationship('FormativeAssessmentModel', lazy='dynamic')


    def __init__(self, topic_id, is_unlocked, name, needed_credit):
        self.topic_id = topic_id
        self.is_unlocked = is_unlocked
        self.name = name
        self.needed_credit = needed_credit
    
    def json(self):
        return {
            'topic_id': self.topic_id,
            'is_unlocked': self.is_unlocked,
            'name': self.name,
            'needed_credit': self.needed_credit,
            'tests': [t.json() for t in self.tests.all()],
            'formative_assessments': [fa.json() for fa in self.formativeAssessments.all()]
        }

    def save_to_database(self):
        database.session.add(self)
        database.session.commit()

    def delete_from_database(self):
        database.session.delete(self)
        database.session.commit()

    @classmethod
    def find_by_id(cls, topic_id):
        return cls.query.filter_by(topic_id=topic_id).first()

    @classmethod
    def get_all(cls):
        return cls.query.all()