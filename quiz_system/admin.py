from django.contrib import admin
from .models import Category, Quiz, Question, Attempt, Choice

class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 4

class QuestionAdmin(admin.ModelAdmin):
    inlines = [ChoiceInline]

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1

class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'room_code', 'category', 'created_by')
    inlines = [QuestionInline]

class AttemptAdmin(admin.ModelAdmin):
    list_display = ('quiz', 'nickname', 'created_by', 'score', 'completed_at')

# Register your models here.
admin.site.register(Category)
admin.site.register(Quiz, QuizAdmin)
admin.site.register(Question, QuestionAdmin)
admin.site.register(Attempt, AttemptAdmin)
