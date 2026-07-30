/* eslint-disable no-console */
import { connect, disconnect, model } from 'mongoose'
import { CandidateSchema } from '../modules/candidates/schemas/candidate.schema'
import { JobSchema } from '../modules/jobs/schemas/job.schema'
import { AssessmentSchema } from '../modules/assessments/schemas/assessment.schema'
import { JourneyStage, WorkStyleType } from '../common/journey'

/**
 * Idempotent seed for local development. Populates a representative slice of the
 * Talemistry domain so the API + both front-ends have data to render.
 * Run with: `npm run seed`
 */
async function run() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/talemistry'
  await connect(uri)
  console.log(`[seed] connected to ${uri}`)

  const Candidate = model('Candidate', CandidateSchema)
  const Job = model('Job', JobSchema)
  const Assessment = model('Assessment', AssessmentSchema)

  await Promise.all([
    Candidate.deleteMany({}),
    Job.deleteMany({}),
    Assessment.deleteMany({}),
  ])

  const jobs = await Job.insertMany([
    {
      title: 'Senior Frontend Engineer',
      department: 'Engineering',
      location: 'Berlin / Remote',
      workModel: 'hybrid',
      status: 'published',
      seniority: 'Senior',
      summary: 'Own the design-system and performance of our recruiter product.',
      mustHaveSkills: ['React', 'TypeScript', 'Accessibility'],
      niceToHaveSkills: ['Next.js', 'WebRTC'],
      salaryMin: 75000,
      salaryMax: 95000,
      applicants: 64,
      inPipeline: 22,
      healthScore: 82,
      slug: 'senior-frontend-engineer',
      metaDescription: 'Join Talemistry as a Senior Frontend Engineer building fair, human hiring tools.',
    },
    {
      title: 'Product Designer',
      department: 'Design',
      location: 'Remote (EU)',
      workModel: 'remote',
      status: 'published',
      seniority: 'Mid-Senior',
      summary: 'Shape candidate-facing experiences with dignity and clarity.',
      mustHaveSkills: ['Product Design', 'Design Systems'],
      salaryMin: 65000,
      salaryMax: 82000,
      applicants: 41,
      inPipeline: 14,
      healthScore: 74,
      slug: 'product-designer',
    },
  ])

  const elements = (a: number, b: number, c: number, d: number, e: number) => [
    { key: 'craft', label: 'Craft & Depth', score: a },
    { key: 'collaboration', label: 'Collaboration', score: b },
    { key: 'ownership', label: 'Ownership', score: c },
    { key: 'learning', label: 'Learning Agility', score: d },
    { key: 'communication', label: 'Communication', score: e },
  ]
  const workStyle = (v1: number, v2: number, v3: number, v4: number) => [
    { axis: 'energy', value: v1, leftLabel: 'Reflective', rightLabel: 'Expressive' },
    { axis: 'cognition', value: v2, leftLabel: 'Concrete', rightLabel: 'Abstract' },
    { axis: 'decisions', value: v3, leftLabel: 'Analytical', rightLabel: 'Empathic' },
    { axis: 'structure', value: v4, leftLabel: 'Adaptive', rightLabel: 'Structured' },
  ]

  await Candidate.insertMany([
    {
      name: 'Amara Okafor',
      title: 'Senior Frontend Engineer',
      location: 'Berlin, DE',
      email: 'amara@example.com',
      yearsExperience: 8,
      matchScore: 92,
      elements: elements(94, 88, 90, 86, 91),
      skills: [
        { name: 'React', level: 95, verified: true, source: 'Live coding' },
        { name: 'TypeScript', level: 90, verified: true, source: 'Live coding' },
        { name: 'Accessibility', level: 82, verified: false },
      ],
      workStyle: workStyle(58, 72, 64, 70),
      workStyleType: WorkStyleType.Architect,
      stage: JourneyStage.Evaluate,
      tags: ['Referral', 'Design systems'],
      summary: 'Systems-minded engineer who raises the craft bar of every team she joins.',
      potentialSpectrum: 88,
      appliedJobs: [jobs[0]._id],
      consentGiven: true,
      consentAt: new Date(),
    },
    {
      name: 'Diego Martínez',
      title: 'Frontend Engineer',
      location: 'Madrid, ES',
      matchScore: 84,
      elements: elements(82, 90, 78, 88, 85),
      skills: [
        { name: 'React', level: 84, verified: true, source: 'Assessment' },
        { name: 'CSS Architecture', level: 88, verified: true },
      ],
      workStyle: workStyle(70, 60, 74, 52),
      workStyleType: WorkStyleType.Catalyst,
      stage: JourneyStage.Match,
      tags: ['Careers site', 'Community'],
      summary: 'Collaborative builder who thrives connecting design and engineering.',
      potentialSpectrum: 80,
      appliedJobs: [jobs[0]._id],
      consentGiven: true,
      consentAt: new Date(),
    },
    {
      name: 'Priya Nair',
      title: 'Product Designer',
      location: 'Lisbon, PT',
      matchScore: 89,
      elements: elements(90, 86, 84, 82, 92),
      skills: [{ name: 'Product Design', level: 92, verified: true }],
      workStyle: workStyle(64, 78, 58, 66),
      workStyleType: WorkStyleType.Explorer,
      stage: JourneyStage.Understand,
      tags: ['Portfolio', 'Referral'],
      summary: 'Designer who turns ambiguous problems into calm, humane interfaces.',
      potentialSpectrum: 86,
      appliedJobs: [jobs[1]._id],
      consentGiven: true,
      consentAt: new Date(),
    },
  ])

  await Assessment.insertMany([
    {
      name: 'Frontend Engineering — React & TypeScript',
      kind: 'skills',
      duration: '60 min',
      description: 'Live coding: component architecture, state, a11y and performance.',
      proctored: true,
      autoScored: true,
      assigned: 24,
      completed: 18,
      avgScore: 78,
    },
    {
      name: 'Work Style & Team Chemistry',
      kind: 'psychometric',
      duration: '20 min',
      description: 'Validated, human-supervised type indicator.',
      autoScored: true,
      assigned: 63,
      completed: 51,
    },
  ])

  console.log('[seed] done: 2 jobs, 3 candidates, 2 assessments')
  await disconnect()
}

run().catch(async (err) => {
  console.error('[seed] failed', err)
  await disconnect()
  process.exit(1)
})
