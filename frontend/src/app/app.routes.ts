import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { QuizListComponent } from './components/quiz-list/quiz-list.component';
import { QuizDetailComponent } from './components/quiz-detail/quiz-detail.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'quizzes', component: QuizListComponent },
  { path: 'quiz/:id', component: QuizDetailComponent },
  { path: '', redirectTo: '/quizzes', pathMatch: 'full' }
];
