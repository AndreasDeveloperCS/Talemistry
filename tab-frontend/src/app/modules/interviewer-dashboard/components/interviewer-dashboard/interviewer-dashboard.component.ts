import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

export interface UpcomingInterview {
  id: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  positionId: string;
  company: string;
  date: string;
  time: string;
  type: string;
  meetingLink: string;
  resumeUrl: string;
}

export interface SubmittedFeedback {
  id: string;
  candidateName: string;
  candidateProfileUrl: string;
  position: string;
  company: string;
  interviewDate: string;
  submittedDate: string;
  rating: number;
  recommendation: string;
  summary: string;
}

export interface PendingFeedback {
  id: string;
  candidateName: string;
  position: string;
  company: string;
  interviewDate: string;
  dueDate: string;
}

export interface Skill {
  name: string;
  level: 'Expert' | 'Advanced' | 'Intermediate';
  yearsExp: number;
  icon: string;
}

export interface CodeSnippet {
  id: string;
  title: string;
  language: string;
  code: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface TechFunnelStage {
  name: string;
  value: number;
  description: string;
  color: string;
}

@Component({
  selector: 'app-interviewer-dashboard',
  templateUrl: './interviewer-dashboard.component.html',
  styleUrl: './interviewer-dashboard.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterviewerDashboardComponent implements OnInit {

  upcomingInterviews: UpcomingInterview[] = [
    { id: '1', candidateName: 'Ilona Ivanova', candidateEmail: 'ilonka7011@gmail.com', position: 'Software Developer', positionId: 'pos-1', company: 'Evryka', date: 'Apr 7, 2026', time: '14:30 - 15:30', type: 'Technical Interview', meetingLink: 'https://meet.google.com/abc-defg-hij', resumeUrl: '/resume/ilona-ivanova.pdf' },
    { id: '2', candidateName: 'Alex Chen', candidateEmail: 'alex.chen@email.com', position: 'Frontend Developer', positionId: 'pos-2', company: 'TechCorp', date: 'Apr 7, 2026', time: '16:00 - 17:00', type: 'System Design', meetingLink: 'https://meet.google.com/xyz-uvwx-yz', resumeUrl: '/resume/alex-chen.pdf' },
    { id: '3', candidateName: 'Maria Santos', candidateEmail: 'maria.s@design.io', position: 'UX Designer', positionId: 'pos-3', company: 'DesignHub', date: 'Apr 8, 2026', time: '10:00 - 11:00', type: 'Portfolio Review', meetingLink: 'https://zoom.us/j/123456789', resumeUrl: '/resume/maria-santos.pdf' },
    { id: '4', candidateName: 'John Smith', candidateEmail: 'john.smith@pm.com', position: 'Product Manager', positionId: 'pos-4', company: 'ProductLab', date: 'Apr 9, 2026', time: '11:30 - 12:30', type: 'Behavioral Interview', meetingLink: 'https://teams.microsoft.com/l/meetup-join/xyz', resumeUrl: '/resume/john-smith.pdf' }
  ];

  submittedFeedback: SubmittedFeedback[] = [
    { id: '1', candidateName: 'Sarah Johnson', candidateProfileUrl: '/candidate/sarah-johnson', position: 'Software Developer', company: 'Evryka', interviewDate: 'Apr 5, 2026', submittedDate: 'Apr 5, 2026', rating: 4, recommendation: 'Strong Hire', summary: 'Excellent problem-solving skills, strong communication' },
    { id: '2', candidateName: 'David Lee', candidateProfileUrl: '/candidate/david-lee', position: 'Frontend Developer', company: 'TechCorp', interviewDate: 'Apr 4, 2026', submittedDate: 'Apr 4, 2026', rating: 5, recommendation: 'Strong Hire', summary: 'Outstanding React expertise, great cultural fit' },
    { id: '3', candidateName: 'Emma Wilson', candidateProfileUrl: '/candidate/emma-wilson', position: 'Backend Developer', company: 'DataFlow', interviewDate: 'Apr 3, 2026', submittedDate: 'Apr 3, 2026', rating: 3, recommendation: 'Maybe', summary: 'Good technical skills, needs improvement in system design' },
    { id: '4', candidateName: 'Michael Brown', candidateProfileUrl: '/candidate/michael-brown', position: 'DevOps Engineer', company: 'CloudScale', interviewDate: 'Apr 2, 2026', submittedDate: 'Apr 2, 2026', rating: 4, recommendation: 'Hire', summary: 'Strong infrastructure knowledge, excellent AWS experience' }
  ];

  pendingFeedback: PendingFeedback[] = [
    { id: '5', candidateName: 'Lisa Anderson', position: 'Data Analyst', company: 'AnalyticsHub', interviewDate: 'Apr 6, 2026', dueDate: 'Apr 8, 2026' }
  ];

  technicalFunnel: TechFunnelStage[] = [
    { name: 'Scheduled',   value: 42, description: 'Total technical interviews assigned', color: '#3d7a7a' },
    { name: 'Completed',   value: 28, description: 'Interviews conducted',                color: '#2e9c9c' },
    { name: 'Passed',      value: 20, description: 'Candidates passed technical round',   color: '#1ab8b8' },
    { name: 'Strong Pass', value: 12, description: 'Exceptional technical performance',   color: '#f5a623' },
  ];

  skills: Skill[] = [
    { name: 'JavaScript / TypeScript', level: 'Expert',       yearsExp: 8, icon: 'JS' },
    { name: 'React / Next.js',         level: 'Expert',       yearsExp: 6, icon: 'R'  },
    { name: 'Node.js',                 level: 'Advanced',     yearsExp: 5, icon: 'N'  },
    { name: 'System Design',           level: 'Advanced',     yearsExp: 4, icon: 'SD' },
    { name: 'Data Structures',         level: 'Expert',       yearsExp: 8, icon: 'DS' },
    { name: 'Algorithms',              level: 'Expert',       yearsExp: 8, icon: 'AL' },
    { name: 'SQL / PostgreSQL',        level: 'Advanced',     yearsExp: 5, icon: 'DB' },
    { name: 'Python',                  level: 'Intermediate', yearsExp: 3, icon: 'PY' },
  ];

  codeSnippets: CodeSnippet[] = [
    {
      id: '1', title: 'Array Deduplication', language: 'JavaScript', category: 'Arrays', difficulty: 'Easy',
      code: `function removeDuplicates(arr) {\n  return [...new Set(arr)];\n}\n\n// Alternative\nfunction removeDuplicatesAlt(arr) {\n  return arr.filter((item, i) => arr.indexOf(item) === i);\n}`
    },
    {
      id: '2', title: 'Debounce Function', language: 'TypeScript', category: 'Patterns', difficulty: 'Medium',
      code: `function debounce<T extends (...args: any[]) => any>(\n  func: T, wait: number\n): (...args: Parameters<T>) => void {\n  let id: ReturnType<typeof setTimeout> | null = null;\n  return (...args) => {\n    if (id) clearTimeout(id);\n    id = setTimeout(() => func(...args), wait);\n  };\n}`
    },
    {
      id: '3', title: 'Binary Search', language: 'TypeScript', category: 'Algorithms', difficulty: 'Medium',
      code: `function binarySearch(arr: number[], target: number): number {\n  let l = 0, r = arr.length - 1;\n  while (l <= r) {\n    const mid = Math.floor((l + r) / 2);\n    if (arr[mid] === target) return mid;\n    arr[mid] < target ? (l = mid + 1) : (r = mid - 1);\n  }\n  return -1;\n}`
    }
  ];

  showAddForm = false;
  copiedId: string | null = null;

  newSnippet: Omit<CodeSnippet, 'id'> = {
    title: '', language: 'JavaScript', code: '', category: '', difficulty: 'Medium'
  };

  ngOnInit(): void {}

  get passRate(): string {
    const completed = this.technicalFunnel[1].value;
    const passed = this.technicalFunnel[2].value;
    return completed > 0 ? ((passed / completed) * 100).toFixed(0) : '0';
  }

  getConversionRate(index: number): number {
    if (index === 0) return 100;
    const prev = this.technicalFunnel[index - 1].value;
    return prev > 0 ? Math.round((this.technicalFunnel[index].value / prev) * 100) : 0;
  }

  // SVG funnel for technical pipeline
  readonly svgWidth = 480;
  readonly svgHeight = 240;

  getFunnelSegments(): { path: string; cx: number; cy: number; value: number; name: string; color: string }[] {
    const n = this.technicalFunnel.length;
    const segH = this.svgHeight / n;
    const cx = this.svgWidth / 2;
    const maxW = 420;
    const minW = 50;
    const maxVal = this.technicalFunnel[0].value || 1;

    return this.technicalFunnel.map((stage, i) => {
      const topW = (stage.value / maxVal) * maxW;
      const nextVal = i < n - 1 ? this.technicalFunnel[i + 1].value : 0;
      const botW = i < n - 1 ? (nextVal / maxVal) * maxW : minW;
      const y1 = i * segH;
      const y2 = (i + 1) * segH;
      const path = `M ${cx - topW / 2} ${y1} L ${cx + topW / 2} ${y1} L ${cx + botW / 2} ${y2} L ${cx - botW / 2} ${y2} Z`;
      return { path, cx, cy: y1 + segH / 2, value: stage.value, name: stage.name, color: stage.color };
    });
  }

  addSnippet(): void {
    if (!this.newSnippet.title.trim() || !this.newSnippet.code.trim()) return;
    this.codeSnippets = [...this.codeSnippets, { ...this.newSnippet, id: Date.now().toString() }];
    this.newSnippet = { title: '', language: 'JavaScript', code: '', category: '', difficulty: 'Medium' };
    this.showAddForm = false;
  }

  deleteSnippet(id: string): void {
    this.codeSnippets = this.codeSnippets.filter(s => s.id !== id);
  }

  copySnippet(snippet: CodeSnippet): void {
    navigator.clipboard.writeText(snippet.code).then(() => {
      this.copiedId = snippet.id;
      setTimeout(() => (this.copiedId = null), 1500);
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  stars(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < rating);
  }

  getRecommendationClass(rec: string): string {
    const map: Record<string, string> = {
      'Strong Hire': 'badge--strong-hire',
      'Hire':        'badge--hire',
      'Maybe':       'badge--maybe',
      'No Hire':     'badge--no-hire',
    };
    return map[rec] ?? 'badge--default';
  }

  getLevelClass(level: string): string {
    const map: Record<string, string> = {
      Expert:       'badge--expert',
      Advanced:     'badge--advanced',
      Intermediate: 'badge--intermediate',
    };
    return map[level] ?? 'badge--default';
  }

  getDifficultyClass(diff: string): string {
    const map: Record<string, string> = {
      Easy:   'badge--easy',
      Medium: 'badge--maybe',
      Hard:   'badge--no-hire',
    };
    return map[diff] ?? 'badge--default';
  }
}
