from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import Quiz, Category, Attempt, Question, Choice
from .serializers import (
    QuizSerializer,
    CategorySerializer,
    QuizStatisticsSerializer,
    UserScoreSerializer,
    AttemptSerializer
)

QUESTION_TIME_LIMIT_MS = 20000
BASE_POINTS = 500
SPEED_BONUS = 500


def _score_for_answer(choice: Choice | None, response_time_ms: int) -> int:
    if choice is None or not choice.is_correct:
        return 0
    rt = max(0, min(int(response_time_ms or 0), QUESTION_TIME_LIMIT_MS))
    remaining_ratio = (QUESTION_TIME_LIMIT_MS - rt) / QUESTION_TIME_LIMIT_MS
    return round(BASE_POINTS + SPEED_BONUS * remaining_ratio)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    refresh = request.data.get('refresh')
    if not refresh:
        return Response({'detail': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        RefreshToken(refresh).blacklist()
    except TokenError:
        pass
    return Response(status=status.HTTP_205_RESET_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def quiz_list_create(request):
    """FBV for Listing and Creating Quizzes (CRUD: Create, Read)"""
    if request.method == 'GET':
        quizzes = Quiz.objects.all()
        serializer = QuizSerializer(quizzes, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = QuizSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def quiz_statistics(request):
    """FBV using a regular Serializer for stats"""
    total_quizzes = Quiz.objects.count()
    total_attempts = Attempt.objects.count()

    data = {
        'total_quizzes': total_quizzes,
        'total_attempts': total_attempts
    }
    serializer = QuizStatisticsSerializer(data)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def join_room(request):
    room_code = request.data.get('room_code')
    if not room_code:
        return Response({'detail': 'Room code is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        quiz = Quiz.objects.get(room_code=room_code)
        return Response({
            'quiz_id': quiz.id,
            'title': quiz.title,
            'room_code': quiz.room_code
        })
    except Quiz.DoesNotExist:
        return Response({'detail': 'Invalid Room Code'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_attempt(request, pk):
    quiz = get_object_or_404(Quiz, pk=pk)
    nickname = (request.data.get('nickname') or '').strip()
    answers = request.data.get('answers') or []
    if not isinstance(answers, list):
        return Response({'detail': 'answers must be a list.'}, status=status.HTTP_400_BAD_REQUEST)

    question_ids = {q.id for q in quiz.questions.all()}
    choices_by_id = {c.id: c for c in Choice.objects.filter(question__quiz=quiz)}

    total_score = 0
    correct_count = 0

    for entry in answers:
        if not isinstance(entry, dict):
            continue
        question_id = entry.get('question_id')
        choice_id = entry.get('choice_id')
        response_time_ms = entry.get('response_time_ms', QUESTION_TIME_LIMIT_MS)

        if question_id not in question_ids:
            continue

        choice = None
        if choice_id is not None:
            candidate = choices_by_id.get(choice_id)
            if candidate is not None and candidate.question_id == question_id:
                choice = candidate

        points = _score_for_answer(choice, response_time_ms)
        if points > 0:
            correct_count += 1
        total_score += points

    attempt = Attempt.objects.create(
        quiz=quiz,
        nickname=nickname,
        created_by=request.user if request.user.is_authenticated else None,
        score=total_score,
    )

    return Response(
        {
            'id': attempt.id,
            'score': total_score,
            'correct_count': correct_count,
            'total': len(question_ids),
        },
        status=status.HTTP_201_CREATED,
    )


class QuizDetail(APIView):
    """CBV for Retrieve, Update, Delete Quizzes (CRUD: Read, Update, Delete)"""

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_object(self, pk):
        return get_object_or_404(Quiz, pk=pk)

    def get(self, request, pk):
        quiz = self.get_object(pk)
        serializer = QuizSerializer(quiz)
        return Response(serializer.data)

    def put(self, request, pk):
        quiz = self.get_object(pk)
        if quiz.created_by != request.user:
            return Response({'detail': 'Not authorized to edit this quiz.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = QuizSerializer(quiz, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        quiz = self.get_object(pk)
        if quiz.created_by != request.user:
            return Response({'detail': 'Not authorized to delete this quiz.'}, status=status.HTTP_403_FORBIDDEN)

        quiz.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def category_list(request):
    categories = Category.objects.all().order_by('name')
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def leaderboard_for_quiz(request, pk):
    quiz = get_object_or_404(Quiz, pk=pk)
    try:
        limit = max(1, min(int(request.query_params.get('limit', 20)), 100))
    except (ValueError, TypeError):
        limit = 20
    top = quiz.attempts.order_by('-score', 'completed_at')[:limit]
    data = [
        {
            'id': a.id,
            'nickname': a.nickname or (a.created_by.username if a.created_by else 'anon'),
            'score': a.score,
            'completed_at': a.completed_at,
        }
        for a in top
    ]
    return Response(data)


class UserScoreView(APIView):
    """CBV using a regular Serializer for custom data"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        attempts = Attempt.objects.filter(created_by=request.user)
        total = attempts.aggregate(Sum('score'))['score__sum'] or 0

        data = {
            'username': request.user.username,
            'total_score': total
        }
        serializer = UserScoreSerializer(data)
        return Response(serializer.data)
