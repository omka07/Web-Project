from rest_framework import serializers
from .models import Category, Quiz, Question, Attempt, Choice

# 2 ModelSerializers
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        # `is_correct` is intentionally NOT exposed to clients so players
        # cannot peek at the answer in DevTools. Correctness is only read
        # server-side during score computation (see views.submit_attempt)
        # and is editable through Django admin.
        fields = ['id', 'text']

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'text', 'choices']

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'room_code', 'category', 'created_by', 'created_at', 'questions']
        read_only_fields = ['created_by']  # Set automatically in views

class AttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attempt
        fields = ['id', 'quiz', 'created_by', 'nickname', 'score', 'completed_at']
        read_only_fields = ['created_by', 'completed_at']

# 2 Regular Serializers
class QuizStatisticsSerializer(serializers.Serializer):
    total_quizzes = serializers.IntegerField()
    total_attempts = serializers.IntegerField()

class UserScoreSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    total_score = serializers.IntegerField()
