from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    # Auth endpoints
    path('api/auth/login/', obtain_auth_token, name='api_token_auth'),
    path('api/auth/logout/', auth_views.LogoutView.as_view(), name='api_logout'),
    
    # FBVs
    path('api/quizzes/', views.quiz_list_create, name='quiz-list-create'),
    path('api/quizzes/join/', views.join_room, name='join-room'),
    path('api/quizzes/stats/', views.quiz_statistics, name='quiz-stats'),
    
    # CBVs
    path('api/quizzes/<int:pk>/', views.QuizDetail.as_view(), name='quiz-detail'),
    path('api/quizzes/<int:pk>/attempt/', views.submit_attempt, name='submit-attempt'),
    path('api/user/score/', views.UserScoreView.as_view(), name='user-score'),
]