import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-interview-assessment',
  templateUrl: './interview-assessment.component.html',
  styleUrl: './interview-assessment.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterviewAssessmentComponent {
  activeTab: string = 'feedback';
  overallScore = 85;
  finalComments = '';

  interviewStatus: string = 'success';

  statusOptions = [
    { value: 'success', label: 'Success', icon: 'thumb_up', color: 'green' },
    { value: 'fail', label: 'Fail', icon: 'thumb_down', color: 'red' },
    { value: 'pending', label: 'Pending', icon: 'hourglass_empty', color: 'gray' }
  ];

  tabs = [
    { label: 'Feedback', key: 'feedback', icon: 'assignment' },
    { label: 'Assessment', key: 'assessment', icon: 'leaderboard' },
    { label: 'Courses', key: 'courses', icon: 'insights' },
    { label: 'Decision', key: 'decision', icon: 'gavel' }
  ];

  strengths: string[] = [
    'Excellent React and TypeScript knowledge',
    'Strong problem-solving skills',
    'Good coding practices',
    'Clear communication'
  ];

  improvements: string[] = [
    'Limited system design experience',
    'Needs more backend knowledge',
    'Could improve testing practices'
  ];

  recommendedCourses = [
    {
      title: 'System Design Fundamentals',
      by: 'Tech Academy',
      description: 'To improve system architecture knowledge',
      priority: 'High'
    },
    {
      title: 'Advanced Node.js Development',
      by: 'Code School',
      description: 'To strengthen backend development skills',
      priority: 'Medium'
    },
    {
      title: 'Testing Best Practices',
      by: 'Dev Institute',
      description: 'To improve testing methodology',
      priority: 'Medium'
    }
  ];

  technicalSkills = [
    { name: 'React', score: 9, max: 10, tag: 'Required' },
    { name: 'TypeScript', score: 8, max: 10, tag: 'Required' },
    { name: 'JavaScript', score: 9, max: 10, tag: 'Required' },
    { name: 'HTML/CSS', score: 8, max: 10, tag: 'Required' },
    { name: 'Node.js', score: 6, max: 10, tag: 'Preferred' },
    { name: 'GraphQL', score: 5, max: 10, tag: 'Preferred' },
    { name: 'Testing', score: 6, max: 10, tag: 'Preferred' },
    { name: 'System Design', score: 5, max: 10, tag: 'Preferred' }
  ];

  softSkills = [
    { name: 'Communication', score: 8, max: 10 },
    { name: 'Teamwork', score: 8, max: 10 },
    { name: 'Problem Solving', score: 9, max: 10 },
    { name: 'Leadership', score: 7, max: 10 },
    { name: 'Adaptability', score: 8, max: 10 }
  ];

  recommendations = [
    'Focus on system design patterns',
    'Learn more about microservices architecture',
    'Improve unit testing skills',
    'Practice API design principles'
  ];

  constructor(
    public dialogRef: MatDialogRef<InterviewAssessmentComponent>) 
  { }

  setActiveTab(tabKey: string): void {
    this.activeTab = tabKey;
  }

  onCancel() {
    this.dialogRef.close();
  }

  updateStatus() { }
}
