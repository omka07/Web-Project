import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { QuizListComponent } from './components/quiz-list/quiz-list.component';
import { QuizDetailComponent } from './components/quiz-detail/quiz-detail.component';
import { JoinRoomComponent } from './components/join-room/join-room.component';
import { RoomComponent } from './components/room/room.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'quizzes', component: QuizListComponent },
  { path: 'quiz/:id', component: QuizDetailComponent },
  { path: 'join', component: JoinRoomComponent },
  { path: 'room/:code', component: RoomComponent },
  { path: '', redirectTo: '/quizzes', pathMatch: 'full' }
];
