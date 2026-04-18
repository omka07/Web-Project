"""Seed demo data for manual testing."""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

from quiz_system.models import Category, Choice, Question, Quiz


DEMO_USER = 'demo'
DEMO_PASSWORD = 'demo12345'
DEMO_CATEGORY = 'General Knowledge'
DEMO_QUIZ_TITLE = 'Kahoot-style Demo'

QUESTIONS = [
    {
        'text': 'What is the capital of France?',
        'choices': [
            ('Berlin', False),
            ('Madrid', False),
            ('Paris', True),
            ('Rome', False),
        ],
    },
    {
        'text': 'Which planet is known as the Red Planet?',
        'choices': [
            ('Venus', False),
            ('Mars', True),
            ('Jupiter', False),
            ('Saturn', False),
        ],
    },
    {
        'text': 'What does HTTP stand for?',
        'choices': [
            ('HyperText Transfer Protocol', True),
            ('High Transfer Text Protocol', False),
            ('HyperTool Transit Protocol', False),
            ('Home Transfer Tool Protocol', False),
        ],
    },
    {
        'text': 'In which year did the first iPhone launch?',
        'choices': [
            ('2005', False),
            ('2007', True),
            ('2009', False),
            ('2010', False),
        ],
    },
    {
        'text': 'Which of these is a JavaScript framework?',
        'choices': [
            ('Laravel', False),
            ('Django', False),
            ('Angular', True),
            ('Rails', False),
        ],
    },
]


class Command(BaseCommand):
    help = 'Seed a demo host user, category, and playable quiz for manual testing.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete the existing demo quiz (and its questions) before seeding.',
        )

    def handle(self, *args, **options):
        # 1. Demo host user
        user, created = User.objects.get_or_create(
            username=DEMO_USER,
            defaults={'email': 'demo@example.com'},
        )
        if created:
            user.set_password(DEMO_PASSWORD)
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f"Created host user '{DEMO_USER}' (password: {DEMO_PASSWORD})."
            ))
        else:
            self.stdout.write(f"Reusing existing user '{DEMO_USER}'.")

        # 2. Category
        category, created = Category.objects.get_or_create(
            name=DEMO_CATEGORY,
            defaults={'description': 'Sample trivia for the demo quiz.'},
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created category '{DEMO_CATEGORY}'."))

        # 3. Quiz (optionally wiped first)
        if options['reset']:
            deleted, _ = Quiz.objects.filter(title=DEMO_QUIZ_TITLE, created_by=user).delete()
            if deleted:
                self.stdout.write(f"Deleted existing demo quiz.")

        quiz, created = Quiz.objects.get_or_create(
            title=DEMO_QUIZ_TITLE,
            created_by=user,
            defaults={'category': category},
        )
        if created:
            self.stdout.write(self.style.SUCCESS(
                f"Created quiz '{DEMO_QUIZ_TITLE}' (code: {quiz.room_code})."
            ))
        else:
            self.stdout.write(f"Quiz '{DEMO_QUIZ_TITLE}' already exists (code: {quiz.room_code}).")

        # 4. Questions + choices
        if quiz.questions.exists():
            self.stdout.write(
                f"Quiz already has {quiz.questions.count()} questions; "
                "leaving them alone. Re-run with --reset to rebuild."
            )
        else:
            for q_data in QUESTIONS:
                question = Question.objects.create(quiz=quiz, text=q_data['text'])
                for (text, is_correct) in q_data['choices']:
                    Choice.objects.create(question=question, text=text, is_correct=is_correct)
            self.stdout.write(self.style.SUCCESS(f"Created {len(QUESTIONS)} questions."))

        # 5. Usage summary
        sep = '-' * 56
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Demo data ready.'))
        self.stdout.write(sep)
        self.stdout.write(f"  Host login:     {DEMO_USER} / {DEMO_PASSWORD}")
        self.stdout.write(f"  Quiz title:     {DEMO_QUIZ_TITLE}")
        self.stdout.write(f"  Room code:      {quiz.room_code}")
        self.stdout.write(f"  Questions:      {quiz.questions.count()}")
        self.stdout.write(sep)
        self.stdout.write(f"  Frontend:       http://localhost:4200")
        self.stdout.write(f"  Host flow:      /login → /quizzes → Play")
        self.stdout.write(f"  Player flow:    /join → enter '{quiz.room_code}' + nickname")
        self.stdout.write(f"  Direct play:    http://localhost:4200/quiz/{quiz.id}/take")
