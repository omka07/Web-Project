from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

urlpatterns = [
    # JWT Auth
    path('api/auth/login/', TokenObtainPairView.as_view(), name='jwt_login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='jwt_refresh'),
    path('api/auth/logout/', views.logout_view, name='jwt_logout'),

    # Quizzes (FBV)
    path('api/quizzes/', views.quiz_list_create, name='quiz-list-create'),
    path('api/quizzes/join/', views.join_room, name='join-room'),
    path('api/quizzes/stats/', views.quiz_statistics, name='quiz-stats'),
    path('api/categories/', views.category_list, name='category-list'),

    # Quizzes (CBV + FBV)
    path('api/quizzes/<int:pk>/', views.QuizDetail.as_view(), name='quiz-detail'),
    path('api/quizzes/<int:pk>/attempt/', views.submit_attempt, name='submit-attempt'),
    path('api/quizzes/<int:pk>/leaderboard/', views.leaderboard_for_quiz, name='quiz-leaderboard'),

    # User
    path('api/user/score/', views.UserScoreView.as_view(), name='user-score'),
]
