import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PlayerService } from '../../services/player.service';
import { LeaderboardEntry } from '../../interfaces/models';

const POLL_INTERVAL_MS = 3000;

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="leaderboard" [class.standalone]="standalone">
      <h3>
        Leaderboard
        @if (standalone) {
          <span class="live-dot" title="Auto-refreshing every 3 seconds"></span>
          <span class="live-label">Live</span>
        }
      </h3>

      @if (isLoading) {
        <div class="loading">Loading leaderboard...</div>
      } @else if (errorMsg) {
        <div class="error-msg">{{ errorMsg }}</div>
      } @else if (entries.length === 0) {
        <p class="empty">No attempts yet — be the first!</p>
      } @else {
        <ol>
          @for (row of entries; track row.id; let i = $index) {
            <li class="row" [class.you]="isYou(row)">
              <span class="rank">{{ i + 1 }}</span>
              <span class="name">
                {{ row.nickname || 'anon' }}@if (isYou(row)) { <em> (you)</em> }
              </span>
              <span class="score">{{ row.score }}</span>
            </li>
          }
        </ol>
      }

      @if (showBackLink) {
        <div class="back-link">
          <a routerLink="/quizzes" class="nav-link">&larr; Back to quizzes</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .leaderboard {
      max-width: 500px;
      margin: 0 auto;
    }
    .leaderboard.standalone {
      margin: 2rem auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      padding: 2rem;
    }
    h3 {
      margin: 0 0 1rem 0;
      text-align: center;
    }
    .live-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #2ecc71;
      border-radius: 50%;
      margin-left: 0.75rem;
      margin-right: 0.25rem;
      animation: pulse 1.6s infinite;
      vertical-align: middle;
    }
    .live-label {
      font-size: 0.75rem;
      color: #2ecc71;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      vertical-align: middle;
    }
    @keyframes pulse {
      0%   { opacity: 1;   transform: scale(1);   }
      50%  { opacity: 0.4; transform: scale(1.3); }
      100% { opacity: 1;   transform: scale(1);   }
    }
    ol {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .row {
      display: grid;
      grid-template-columns: 40px 1fr auto;
      align-items: center;
      padding: 0.6rem 0.75rem;
      gap: 1rem;
      border-bottom: 1px solid #ecf0f1;
    }
    .row:last-child { border-bottom: none; }
    .row.you {
      background: #e8f4fc;
      border-radius: 6px;
      font-weight: 600;
    }
    .rank { color: #6c757d; font-weight: 500; }
    .name { text-align: left; }
    .score { font-weight: bold; color: #2c3e50; }
    em { color: #3498db; font-style: normal; font-weight: 500; }
    .empty {
      text-align: center;
      color: #6c757d;
      padding: 1rem;
    }
    .error-msg {
      color: #dc3545;
      text-align: center;
      padding: 1rem;
    }
    .loading {
      text-align: center;
      color: #6c757d;
      padding: 1rem;
    }
    .back-link {
      margin-top: 1.5rem;
      text-align: center;
    }
    .nav-link {
      color: #3498db;
      text-decoration: none;
    }
    .nav-link:hover { text-decoration: underline; }
  `]
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private player = inject(PlayerService);

  private pollId: ReturnType<typeof setInterval> | null = null;

  /** If provided, the component is used as an embed (e.g. in the finish screen). */
  @Input() quizId?: number;
  @Input() limit = 20;
  @Input() showBackLink = false;

  entries: LeaderboardEntry[] = [];
  isLoading = true;
  errorMsg = '';
  standalone = false;

  ngOnInit() {
    if (this.quizId == null) {
      this.standalone = true;
      this.showBackLink = true;
      const p = this.route.snapshot.paramMap.get('id');
      this.quizId = p ? parseInt(p, 10) : undefined;
    }
    if (this.quizId != null) {
      this.load();
      // Only poll in standalone (route) mode — the finish-screen embed is
      // shown once and doesn't need continuous refresh.
      if (this.standalone) {
        this.pollId = setInterval(() => this.load(true), POLL_INTERVAL_MS);
      }
    } else {
      this.errorMsg = 'No quiz specified.';
      this.isLoading = false;
    }
  }

  ngOnDestroy() {
    if (this.pollId !== null) {
      clearInterval(this.pollId);
      this.pollId = null;
    }
  }

  isYou(row: LeaderboardEntry): boolean {
    const me = (this.player.nickname() || '').trim().toLowerCase();
    return !!me && row.nickname.trim().toLowerCase() === me;
  }

  private load(silent = false) {
    this.api.getLeaderboard(this.quizId!, this.limit).subscribe({
      next: (data) => {
        this.entries = data;
        this.isLoading = false;
        if (silent) this.errorMsg = '';
      },
      error: () => {
        // On polling errors, keep the last data visible rather than replacing
        // the list with an error banner — the next tick will usually succeed.
        if (!silent) {
          this.errorMsg = 'Failed to load leaderboard.';
        }
        this.isLoading = false;
      },
    });
  }
}
