// Professional CV data for /print/all — condensed by hand from the CV at
// self.gungor.dev/cv (source of truth for the engineering history). Art
// projects are deliberately absent: they live in the manifest and render as
// the ART section. Keep each desc to ~2 printed lines; markdown bold allowed.

export type Experience = {
  role: string
  org: string
  duration: string
  desc: string
}

export const ENGINEERING: Experience[] = [
  {
    role: 'Freelance Fullstack Engineer',
    org: 'Self Employed',
    duration: 'May 2024 — present',
    desc: 'AI-focused product work for various clients: lead development of an **AI video-ad generation** product with a complex & distributed JSON-based AI workflow engine for **shopnomix**; backend & editor features for the app builder **reyapp.io**; MVP of **informed copilot** — open-source and hosted **LLMs** (Llama, Mistral, ChatGPT on Azure, Whisper) with **RAG** and **agentic workflows**, on **Phoenix LiveView**.',
  },
  {
    role: 'Senior Backend Engineer',
    org: 'informed News',
    duration: 'June 2022 — Sept 2023',
    desc: 'News-summarization startup. Designed and built the editorial **CMS** in **Phoenix LiveView**; day-to-day backend features exposed over **GraphQL**; AI tooling (summarization, entity recognition) on OpenAI APIs; edge-served a fine-tuned **BERT** model with Elixir Bumblebee.',
  },
  {
    role: 'Senior Backend Engineer',
    org: 'diesdas.digital',
    duration: 'Sept 2020 — May 2022',
    desc: 'Berlin digital product studio (Red Bull, Miele, Zeit Online). Built and led **Red Bull’s support chatbot**; a real-time social game on **Elixir/Phoenix + WebRTC**; maintained **mycountrytalks.org** (Rails, with bitcrowd); prototyping for the **Arolsen Archives**’ online archive.',
  },
  {
    role: 'Engineering Team Lead',
    org: 'Marley Spoon',
    duration: 'Feb 2020 — Sept 2020',
    desc: 'Meal-kit delivery at global scale. Led the technical effort for new-country expansion and the Taste Profile Wizard; owned **GraphQL** API services connecting frontend, mobile and cookbook teams; managed the Customer Experience team.',
  },
  {
    role: 'Senior Software Engineer',
    org: 'mindhood',
    duration: 'May 2019 — Dec 2019',
    desc: 'First-round engineer on a bite-sized, chat-like learning platform: designed and shipped the **WYSIWYG editor SPA** for conversational content; rewrote the backend RESTfully in **Node.js + MongoDB**; CI/delivery on CircleCI and Dokku.',
  },
  {
    role: 'Lead Software Engineer',
    org: 'LeventOfis Teknoloji',
    duration: 'Aug 2017 — May 2019',
    desc: 'Digital product agency; led a team of four. Web products in **Rails, Node.js, Next.js, React** — monolith and microservice architectures; an internal CMS platform on **Docker/Kubernetes**; client strategy and mentoring of junior engineers.',
  },
  {
    role: 'Tech Lead / CTO',
    org: 'Universiteplus',
    duration: 'Feb 2014 — May 2016',
    desc: 'Online learning platform; joined pre-seed as a contractor, took over as CTO after funding — built the web platform (**Rails, PostgreSQL, Backbone.js**) and a product team of three.',
  },
  {
    role: 'Ruby on Rails Developer',
    org: 'VNGRS',
    duration: 'Mar 2013 — Feb 2014',
    desc: 'Product agency & outsourcing. New features for **Bookish**’s backoffice and storefront (Rails, MongoDB, PostgreSQL, AWS); a Flipboard-integration service in **Scala/Play**; an internal QA/error-propagation library for Rails apps.',
  },
]

export const EDUCATION: Experience[] = [
  {
    role: 'BSc, Computer Science and Engineering',
    org: 'Işık University, Istanbul',
    duration: '2007 — 2011',
    desc: '',
  },
]
