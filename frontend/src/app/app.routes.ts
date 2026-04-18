import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { QuizListComponent } from './components/quiz-list/quiz-list.component';
import { QuizDetailComponent } from './components/quiz-detail/quiz-detail.component';
import { JoinRoomComponent } from './components/join-room/join-room.component';
import { RoomComponent } from './components/room/room.component';
import { TakeQuizComponent } from './components/take-quiz/take-quiz.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'quizzes', component: QuizListComponent, canActivate: [authGuard] },
  { path: 'quiz/:id', component: QuizDetailComponent, canActivate: [authGuard] },
  { path: 'quiz/:id/take', component: TakeQuizComponent },
  { path: 'quiz/:id/leaderboard', component: LeaderboardComponent },
  { path: 'join', component: JoinRoomComponent },
  { path: 'room/:code', component: RoomComponent },
  { path: '', redirectTo: '/quizzes', pathMatch: 'full' }
];
