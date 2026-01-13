-- Seed Leads Data for Daily Stack Testing
-- Run this script AFTER you've created the leads table and authenticated a user
-- Replace 'YOUR_USER_ID_HERE' with your actual user UUID from auth.users

-- Sample leads data with diverse job postings
INSERT INTO leads (
  assigned_to,
  job_title,
  company_name,
  salary_min,
  salary_max,
  salary_currency,
  location,
  remote_type,
  summary,
  description,
  requirements,
  benefits,
  source,
  source_url,
  status
) VALUES
-- Lead 1: High-paying tech role
(
  'YOUR_USER_ID_HERE',
  'Senior Full-Stack Engineer',
  'TechCorp Solutions',
  150000,
  200000,
  'USD',
  'San Francisco, CA',
  'hybrid',
  'Join our fast-growing startup building the next generation of cloud infrastructure. Work with cutting-edge technologies and solve complex distributed systems problems.',
  'We are seeking an experienced Full-Stack Engineer to lead critical initiatives in our platform engineering team. You will architect and build scalable services that power millions of users daily.',
  ARRAY[
    '5+ years of experience with React and Node.js',
    'Strong understanding of distributed systems',
    'Experience with AWS or GCP',
    'Excellent communication skills',
    'Bachelor''s degree in Computer Science or equivalent'
  ],
  ARRAY[
    'Competitive equity package',
    'Unlimited PTO',
    'Full health, dental, and vision insurance',
    '$5,000 annual learning budget',
    'Latest tech equipment'
  ],
  'LinkedIn',
  'https://linkedin.com/jobs/12345',
  'new'
),

-- Lead 2: Remote data science role
(
  'YOUR_USER_ID_HERE',
  'Machine Learning Engineer',
  'DataInnovate AI',
  130000,
  170000,
  'USD',
  'Austin, TX',
  'remote',
  'Build and deploy ML models at scale. Work on recommendation systems, NLP, and computer vision projects that impact millions of users worldwide.',
  'We are looking for a passionate ML Engineer to join our AI research team. You will work on cutting-edge problems in deep learning and help productionize models.',
  ARRAY[
    'MS or PhD in Computer Science, Statistics, or related field',
    '3+ years of experience with PyTorch or TensorFlow',
    'Strong Python programming skills',
    'Experience with MLOps and model deployment',
    'Published research papers (preferred)'
  ],
  ARRAY[
    'Remote-first culture',
    'Generous stock options',
    'Comprehensive health benefits',
    'Home office setup allowance',
    'Quarterly team retreats'
  ],
  'Indeed',
  'https://indeed.com/jobs/67890',
  'new'
),

-- Lead 3: Design role with lower salary
(
  'YOUR_USER_ID_HERE',
  'Senior Product Designer',
  'Creative Studios Inc',
  100000,
  140000,
  'USD',
  'New York, NY',
  'onsite',
  'Design beautiful and intuitive user experiences for our B2B SaaS platform. Collaborate with product and engineering teams to ship delightful features.',
  'Join a design-first company where creativity and user empathy drive everything we do. You will own the end-to-end design process for key product areas.',
  ARRAY[
    '5+ years of product design experience',
    'Expert in Figma and prototyping tools',
    'Strong portfolio showcasing B2B work',
    'Experience conducting user research',
    'Excellent visual design skills'
  ],
  ARRAY[
    'Work in our beautiful NYC office',
    'Unlimited PTO',
    'Health and wellness stipend',
    'Latest design tools and equipment',
    'Professional development budget'
  ],
  'Dribbble',
  'https://dribbble.com/jobs/job-123',
  'new'
),

-- Lead 4: Sales role
(
  'YOUR_USER_ID_HERE',
  'Enterprise Account Executive',
  'SalesForce Pro',
  120000,
  180000,
  'USD',
  'Boston, MA',
  'hybrid',
  'Drive revenue growth by closing enterprise deals. Build relationships with C-level executives and become a trusted advisor to our largest customers.',
  'We are seeking a top-performing AE to join our rapidly growing enterprise sales team. You will manage a full sales cycle from prospecting to close.',
  ARRAY[
    '5+ years of enterprise B2B sales experience',
    'Proven track record of exceeding quota',
    'Experience selling SaaS products',
    'Strong presentation and negotiation skills',
    'Salesforce proficiency'
  ],
  ARRAY[
    'Uncapped commission potential',
    'President''s Club trips',
    'Full benefits package',
    'Career advancement opportunities',
    'Sales enablement training'
  ],
  'LinkedIn',
  'https://linkedin.com/jobs/sales-999',
  'new'
),

-- Lead 5: Junior developer role
(
  'YOUR_USER_ID_HERE',
  'Junior Frontend Developer',
  'WebWorks Agency',
  70000,
  90000,
  'USD',
  'Seattle, WA',
  'remote',
  'Start your career building modern web applications with React and TypeScript. Learn from experienced mentors in a supportive environment.',
  'We are looking for an enthusiastic junior developer to join our agency team. You will work on diverse client projects and rapidly grow your skills.',
  ARRAY[
    '1-2 years of experience or relevant bootcamp training',
    'Solid understanding of JavaScript/TypeScript',
    'Familiarity with React',
    'Strong desire to learn and grow',
    'Portfolio of personal or academic projects'
  ],
  ARRAY[
    'Mentorship program',
    'Flexible remote work',
    'Health insurance',
    'Conference attendance',
    'Career growth path'
  ],
  'AngelList',
  'https://angellist.com/jobs/junior-dev',
  'new'
);

-- Note: After running this script, you should see these 5 leads in the Daily Stack modal!
-- Don't forget to replace 'YOUR_USER_ID_HERE' with your actual user ID.
