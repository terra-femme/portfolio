// Case-study content for the Projects page (projects.html).
//
// Every claim here comes from the project's README or a file in its repo.
// Anything the README does not state is left out rather than guessed. Status
// labels are deliberately modest: "built" means the code exists, not that it
// is deployed or in production. Public copy: no em dashes (see CLAUDE.md).
//
// To add a project: copy one object, give it a unique `id`, and drop its
// screenshot in public/screenshots/ with the path below. Leave `image` out for
// a project with no screenshot yet, and the card falls back to the same
// gradient face the home page uses.
//
// `repo` is a full GitHub URL, or null when the project has no public repo.

const BASE = import.meta.env.BASE_URL;

export const caseStudies = [
  {
    id: 'hiscribe',
    title: 'HiScribe',
    tag: 'Clinical AI',
    desc: 'Ambient clinical scribe with provider review and FHIR output.',
    status: 'Pipeline built',
    statusTone: 'live',
    // `layout: 'top'` puts the image full width above the text, with no sticky
    // behaviour. Other projects keep the side-by-side layout.
    layout: 'top',
    // `plain: true` removes the card's hover flip and text overlay. The title
    // and description are already printed under the image.
    // `embed` shows the working prototype in a sandboxed frame, so its
    // animations and Approve button run on the card. The prototype is a
    // conceptual demo, and its footer says so.
    embed: `${BASE}demos/hiscribe-prototype.html`,
    embedTitle: 'HiScribe conceptual workflow prototype',
    initial: 'H',
    grad: ['#1f8a4c', '#2b5cff'],
    problem:
      'Physicians spend a large share of their time on EHR documentation, and after-hours charting is a major driver of burnout. HiScribe listens to a visit, separates the two speakers, and maps the conversation into a SOAP note for the provider to review.',
    does:
      'A LangGraph pipeline turns the transcript into SOAP sections. The provider reviews and approves every entry before anything enters the record. The approved note is output as FHIR R4B and sent to an interface engine as HL7 v2 MDM^T02.',
    stack: ['LangGraph', 'Gladia ASR (default)', 'OpenAI gpt-4o-mini (default)', 'FHIR R4B', 'HL7 v2 via Mirth Connect', 'SQLite (default)', 'Docker Compose'],
    metrics: [],
    note:
      'The Azure Speech, Azure OpenAI, and Azure Blob adapters are stubs that throw "not yet implemented." The repo README says so, and this page does not claim HiScribe runs on Azure.',
    repo: 'https://github.com/terra-femme/HiScribe',
  },
  {
    id: 'medjournee',
    title: 'MedJournee',
    tag: 'Multilingual AI',
    desc: 'Private medical journal for families with language barriers.',
    status: 'Deploy config in repo',
    statusTone: 'live',
    image: `${BASE}screenshots/medjournee.png`,
    imageAlt: 'MedJournee live diarization and translation',
    initial: 'M',
    grad: ['#7c5cff', '#4fd6e0'],
    problem:
      'Families with limited English proficiency miss diagnoses and treatment instructions, and cannot take part in care decisions. MedJournee gives them a private record of the conversation in their own language.',
    does:
      'A family member starts a live session before an appointment. The conversation is transcribed, translated, and processed through a five-agent pipeline: transcription, diarization, translation, terminology, and summarization. The result is a journal entry with speaker labels, a terminology guide, and an optional plain-language summary.',
    stack: ['Python', 'Five-agent pipeline', 'Render (render.yaml in repo)', 'PWA assets'],
    metrics: [],
    note: '',
    repo: 'https://github.com/terra-femme/MedJournee',
  },
  {
    id: 'medtracker',
    title: 'MedTracker',
    tag: 'Patient safety',
    desc: 'Medication schedules, reminders, and adherence tracking.',
    status: 'Scaffold, features in progress',
    statusTone: 'wip',
    image: `${BASE}screenshots/medtracker.jpeg`,
    imageAlt: 'MedTracker widget on iPhone',
    initial: 'T',
    grad: ['#22d3a6', '#2b5cff'],
    problem:
      'Medication non-adherence is costly and common when patients manage several prescriptions. MedTracker is built to help people keep their schedules, get reminders, and record what they took.',
    does:
      'The README calls this a foundational scaffold. The core architecture is in place and features are being built iteratively. The repo includes a dose agent, a backend, a frontend, and a vector store folder. This page does not describe features that are not built yet.',
    stack: ['Python backend', 'Frontend', 'Dose agent', 'Chroma vector store folder'],
    metrics: [],
    note: '',
    repo: 'https://github.com/terra-femme/MedTracker',
  },
  {
    id: 'vocaliso',
    title: 'VocalIso',
    tag: 'Audio data',
    desc: 'Voice dataset quality pipeline with DSP correction and anomaly scoring.',
    status: 'CLI built',
    statusTone: 'live',
    // Synthetic demo of the pipeline's six measurements and anomaly score.
    // Shown full width, like HiScribe. The footer says it is not real data.
    layout: 'top',
    embed: `${BASE}demos/vocaliso-dashboard.html`,
    embedTitle: 'VocalIso pipeline dashboard, synthetic demo',
    embedRatio: '16 / 11',
    initial: 'V',
    grad: ['#f2c14e', '#22d3a6'],
    problem:
      'Recordings from different microphones, rooms, and gain settings come out at inconsistent levels, with different noise floors and sibilance. Training a TTS or ASR model on that audio gives inconsistent results.',
    does:
      'A Python CLI measures six acoustic features per file, runs a DSP correction chain, validates the output, and uses a PyTorch anomaly detector to score each file from 0 to 1. It automates the quality control step that would otherwise be done by hand in a DAW.',
    stack: ['Python 3.11', 'FFmpeg', 'PyTorch', 'DSP chain'],
    metrics: [],
    note: '',
    repo: null,
  },
  {
    id: 'fairlending',
    title: 'Fair Lending Quant',
    tag: 'Statistics',
    desc: 'Disparity testing on public HMDA mortgage data.',
    status: 'Phases 0 to 8 complete',
    statusTone: 'live',
    image: `${BASE}screenshots/fairlendingquant.jpg`,
    imageAlt: 'Fair Lending Quant dashboard',
    initial: 'F',
    grad: ['#ef6f6c', '#f2c14e'],
    problem:
      'Fair-lending compliance work depends on statistical testing of lending outcomes. This project builds that testing pipeline on public HMDA mortgage data.',
    does:
      'Logistic regression, hypothesis testing, and a demographic proxy method, with a locally hosted interactive dashboard. Every figure is computed by the code in the repo.',
    stack: ['Python', 'Logistic regression', "Welch's t-test", 'Local dashboard'],
    metrics: [
      { value: '0.742', label: 'Underwriting odds ratio, Black vs White applicants, controlling for income, loan amount, and DTI (95% CI 0.728 to 0.756, n = 483,441)' },
      { value: '0.241 pts', label: 'Average rate difference in the pricing t-test. Statistically significant, but a small effect (Cohen\'s d = -0.129)' },
      { value: '86.4%', label: 'Geography-only proxy accuracy, tied with the majority-class baseline' },
    ],
    note:
      'The README is explicit: public HMDA data excludes applicant credit score, so these results are not a conclusion about discrimination.',
    repo: null,
  },
  {
    id: 'ai-enablement',
    title: 'AI Enablement & Governance',
    tag: 'Teaching',
    desc: 'Tiered AI literacy and governance curriculum for non-technical teams.',
    status: 'Public repo',
    statusTone: 'live',
    image: `${BASE}screenshots/AIGovernance.jpg`,
    imageAlt: 'AI Enablement and Governance learning ladder',
    initial: 'A',
    grad: ['#4fd6e0', '#7c5cff'],
    problem:
      'Non-technical organizations are adopting AI without shared rules for safe use, data handling, or accountability.',
    does:
      'A tiered syllabus from literacy to governance, with an acceptable-use template, human-in-the-loop guidance, and an AI-threat playbook mapped to NIST AI RMF and ISO 42001.',
    stack: ['Curriculum', 'Playbooks', 'NIST AI RMF', 'ISO 42001'],
    metrics: [],
    note: '',
    repo: 'https://github.com/terra-femme/AI_Enablement',
  },
];
