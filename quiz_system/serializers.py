from rest_framework import serializers
from .models import Category, Quiz, Question, Attempt

# 2 ModelSerializers
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'category', 'created_by', 'created_at']
        read_only_fields = ['created_by']  # Set automatically in views

# 2 Regular Serializers
class QuizStatisticsSerializer(serializers.Serializer):
    total_quizzes = serializers.IntegerField()
    total_attempts = serializers.IntegerField()

class UserScoreSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    total_score = serializers.IntegerField()
