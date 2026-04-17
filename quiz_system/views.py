from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Sum

from .models import Quiz, Category, Attempt
from .serializers import (
    QuizSerializer, 
    CategorySerializer, 
    QuizStatisticsSerializer, 
    UserScoreSerializer,
    AttemptSerializer
)

# 2 Function-Based Views (FBV)

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
            # Link new objects to request.user
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
# We might want this accessible without authentication, or keep IsAuthenticated if joining requires login
@permission_classes([IsAuthenticated])
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
@permission_classes([IsAuthenticated])
def submit_attempt(request, pk):
    quiz = get_object_or_404(Quiz, pk=pk)
    
    # We allow the user to provide a nickname and a score
    data = {
        'quiz': quiz.id,
        'nickname': request.data.get('nickname', ''),
        'score': request.data.get('score', 0)
    }
    
    serializer = AttemptSerializer(data=data)
    if serializer.is_valid():
        # Save with the authenticated user if available
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 2 Class-Based Views (CBV)

class QuizDetail(APIView):
    """CBV for Retrieve, Update, Delete Quizzes (CRUD: Read, Update, Delete)"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Quiz, pk=pk)

    def get(self, request, pk):
        quiz = self.get_object(pk)
        serializer = QuizSerializer(quiz)
        return Response(serializer.data)

    def put(self, request, pk):
        quiz = self.get_object(pk)
        # Ensure only the creator can update
        if quiz.created_by != request.user:
            return Response({'detail': 'Not authorized to edit this quiz.'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = QuizSerializer(quiz, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        quiz = self.get_object(pk)
        # Ensure only the creator can delete
        if quiz.created_by != request.user:
            return Response({'detail': 'Not authorized to delete this quiz.'}, status=status.HTTP_403_FORBIDDEN)
            
        quiz.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserScoreView(APIView):
    """CBV using a regular Serializer for custom data"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Calculate total score for current user across all attempts
        attempts = Attempt.objects.filter(created_by=request.user)
        total = attempts.aggregate(Sum('score'))['score__sum'] or 0
        
        data = {
            'username': request.user.username,
            'total_score': total
        }
        serializer = UserScoreSerializer(data)
        return Response(serializer.data)

