/* ==========================================================================
   content.js: everything written on the website lives in this file.

   Edit any text below, save, and reload the page.
   Strings may contain a little HTML:
     <b>bold</b>     <a href='https://...'>link</a>
     <mark>gold highlight</mark>     <span class='hl'>coral highlight</span>
   Lists are shown in the order written here (newest first).
   ========================================================================== */

window.SITE = {
  meta: {
    lastUpdated: "October 2026",
  },

  /* Sections listed here are hidden (their content below is kept, so you
     can show one again by deleting it from this list). Section ids:
     about, prospects, news, setbacks, education, research, interests,
     experience, honors, skills, contact */
  hiddenSections: ["honors", "skills"],

  // Optional custom headings for sections, by id
  sectionTitles: { experience: "Research Experience" },

  /* ---------- Left sidebar ---------- */
  profile: {
    name: "Le Canh Hai",
    initials: "LCH", // shown until a photo exists at the path below
    photo: "assets/img/avatar.jpg", // a square photo
    subtitle: "Applied Mathematics",
    affiliation: [
      "Research Assistant · COSMOS Lab, VinUniversity",
      "B.Sc. Mathematics &amp; Informatics · HUST",
    ],
    location: "Hanoi, Vietnam",
    timezone: "Asia/Ho_Chi_Minh",
    email: "hai.lc.math@gmail.com",
    cv: "assets/files/CV_Le_Canh_Hai.pdf", // opened in the on-page viewer, which also offers a download
    // words that circle the photo, and a one-line status under the name
    ring: "Optimization · Dynamical systems · Mathematical modelling · ",
    status: "Open to graduate study &amp; RA roles",
    // Paste full URLs to show the icons; empty ones stay hidden.
    links: {
      scholar: "", // https://scholar.google.com/citations?user=...
      orcid: "", // https://orcid.org/0000-0000-0000-0000
      github: "", // https://github.com/...
      linkedin: "", // https://www.linkedin.com/in/...
      researchgate: "",
    },
  },

  /* ---------- Big opening panel ---------- */
  // The three cards travel around the limit cycle drawn in the background.
  hero: {
    left: "A research loop",
    right: "21.03° N · 105.85° E",
    loop: [
      { word: "Model", note: "real systems into equations" },
      { word: "Analyze", note: "stability, cycles, thresholds" },
      { word: "Optimize", note: "algorithms with guarantees" },
    ],
    footer: "Background: orbits of ṙ = r(1 − r²), θ̇ = ω, all drawn to one limit cycle",
  },

  /* ---------- 01 About ---------- */
  about: {
    paragraphs: [
      "I am a mathematics graduate of <a href='https://hust.edu.vn' target='_blank' rel='noopener'>Hanoi University of Science and Technology (HUST)</a>, where I completed a Bachelor's degree in <b>Mathematics and Informatics</b> (2022–2026) with a cumulative GPA of <mark>3.89/4.00</mark> and an <mark>Excellent</mark> classification. I ranked <span class='hl'>1st of 166</span> in my programme and graduated as the <span class='hl'>valedictorian of the Faculty of Mathematics and Informatics</span>.",
      "I am currently a <span class='hl'>Research Assistant at the COSMOS Lab, <a href='https://vinuni.edu.vn' target='_blank' rel='noopener'>VinUniversity</a></span>, working with <span class='hl'>Prof. Ali Moussaoui</span> on fishery models with rarity-dependent prices: their equilibria, stability, maximum sustainable yield and Hopf bifurcations. At HUST, I continue to work with <span class='hl'>Assoc. Prof. Nguyen Thi Thu Thuy</span> on optimization algorithms for variational inequalities.",
    ],
    approach: {
      legend: "Research approach",
      paragraphs: [
        "My training combines analysis, optimization, differential equations and numerical methods with programming, so I like to work on a problem from both sides: <mark>prove what a method or a model guarantees, then test it numerically</mark>.",
        "For my graduation thesis (graded <b>9.6/10</b>), I developed a self-adaptive inertial algorithm for split variational inequalities that needs <b>no prior knowledge of Lipschitz constants or operator norms</b>, and proved that it converges strongly to the minimum-norm solution. The project taught me to check carefully how the assumptions behind a proof carry over to concrete numerical examples.",
        "I am now most interested in <mark>why a model predicts different outcomes as its parameters change</mark>, and in explaining those transitions mathematically. My interests span Optimization, Nonlinear Dynamical Systems, Mathematical Modelling and Numerical Analysis.",
      ],
    },
    glance: [
      { value: "3.89<small>/4</small>", label: "Cumulative GPA" },
      { value: "1st<small>/166</small>", label: "In programme · Valedictorian" },
      { value: "03", label: "Research projects" },
    ],
  },

  /* ---------- 02 Prospects ---------- */
  prospects: {
    paragraphs: [
      "I am preparing to pursue a <b>research-oriented Master's degree in mathematics</b>, followed by doctoral study in applied mathematics. I want a broader theoretical foundation in optimization, analysis and numerical methods, while continuing to work on nonlinear dynamical systems.",
      "Alongside research, I want to keep tutoring and mentoring students with limited access to education. The Chap Canh Bach Khoa community supported my own studies, and giving back has become a personal commitment.",
      "I am open to research assistant positions and collaborations in optimization and dynamical systems. Feel free to reach me at <a href='mailto:hai.lc.math@gmail.com'>hai.lc.math@gmail.com</a>.",
    ],
  },

  /* Scrolling ribbon between Prospects and News: two rows of quotes that
     drift in opposite directions. Large row first, small row second. */
  quotes: [
    { text: "Nothing at all takes place in the universe in which some rule of maximum or minimum does not appear.", by: "Leonhard Euler" },
    { text: "The great watershed in optimization isn't between linearity and nonlinearity, but convexity and nonconvexity.", by: "R. Tyrrell Rockafellar" },
    { text: "All models are wrong, but some are useful.", by: "George Box" },
    { text: "Nature is thrifty in all its actions.", by: "Pierre-Louis Maupertuis" },
  ],
  quotesSmall: [
    { text: "The purpose of computing is insight, not numbers.", by: "Richard Hamming" },
    { text: "Nature always acts by the shortest paths.", by: "Pierre de Fermat" },
    { text: "We must know. We will know.", by: "David Hilbert" },
    { text: "Premature optimization is the root of all evil.", by: "Donald Knuth" },
  ],

  /* ---------- 03 News ---------- */
  // key: true colours the date gold. "initial" items show before "Show more".
  news: {
    initial: 6,
    items: [
      { date: "Sep 2026", key: true, text: "Joined the <b>COSMOS Lab, VinUniversity</b> as a Research Assistant, working with Prof. Ali Moussaoui on fishery models with rarity-dependent prices." },
      { date: "Aug 2026", key: true, text: "Graduated from HUST with a B.Sc. in Mathematics and Informatics: GPA 3.89/4.00, ranked 1st of 166 in my programme, and <b>valedictorian of the Faculty of Mathematics and Informatics</b>." },
      { date: "Jul 2026", text: "Attended the <b>VIASM Summer School on Optimization and Decision Theory</b> in Quy Nhon, with lectures by Prof. Patrick L. Combettes on Krasnosel'skii–Mann iterations." },
      { date: "May 2026", key: true, text: "Presented my paper on split variational inequalities, as first author, at the <b>43rd Student Research Conference</b>, HUST." },
      { date: "Nov 2025", text: "Represented HUST at the <b>“Red Journey”</b> Vietnam–China Youth Cultural &amp; Academic Exchange in Wuhan and Chongqing." },
      { date: "Jul 2025", key: true, text: "Took part in the <b>KAIST International Summer School for Advanced Undergraduate Students</b> in Daejeon as a fully funded participant." },
      { date: "Feb 2025", text: "Started as a Research Assistant at HUST with Assoc. Prof. Nguyen Thi Thu Thuy, working on algorithms for variational inequalities." },
      { date: "2024", text: "Took over coordination of the Chap Canh Bach Khoa tutoring programme for students in Mu Cang Chai." },
      { date: "2023", text: "Started teaching free mathematics lessons to secondary-school students in Mu Cang Chai." },
      { date: "2022", text: "Started my B.Sc. in Mathematics and Informatics at HUST." },
    ],
  },

  /* Optional honest log of rejections and misses, shown only when non-empty.
     Example: { date: "Mar 2026", text: "Application to ... was not successful." } */
  setbacks: [],

  /* ---------- Education ---------- */
  education: {
    thesis: {
      label: "Undergraduate thesis · 9.6/10",
      title: "A Self-Adaptive Inertial Algorithm for Split Variational Inequalities with Applications to Traffic Networks",
      rows: [
        ["Advisor", "Assoc. Prof. Nguyen Thi Thu Thuy"],
        ["Presented", "43rd Student Research Conference, HUST (May 2026), as first author", "gold"],
        ["Result", "Strong convergence to the minimum-norm solution for monotone, Lipschitz operators, with no Lipschitz constants or operator norm needed"],
        ["Application", "Equilibrium flows in a time-dependent two-city traffic network"],
      ],
    },
    timeline: [
      {
        when: "2022 – 2026",
        title: "Bachelor's Degree in Mathematics and Informatics",
        detail: "GPA <mark>3.89/4.00</mark> · Excellent · ranked <b>1st of 166</b> · <span class='hl'>Graduation Valedictorian</span>",
        place: "Faculty of Mathematics and Informatics<br>Hanoi University of Science and Technology (HUST)",
        chips: ["Optimization Methods", "Partial Differential Equations", "Probability &amp; Statistics", "Numerical Analysis", "Functional Analysis", "Complex Analysis"],
      },
    ],
  },

  /* ---------- Research ---------- */
  // diagram: "fishery" | "svi" (interactive panels drawn by assets/js/diagrams.js)
  // tags tone: "coral" (primary accent) | "gold" (secondary accent) | "paper"
  // links: { text, url }; without url the text shows as a [note]
  research: {
    note: "Each project pairs analysis with numerical experiments. Open <b>Method</b> for an interactive schematic, and <b>Abstract</b> for a paper's summary.",
    items: [
      {
        year: 2026,
        title: "Maximum Sustainable Yield and Hopf Bifurcation for a Fishery with a Rarity-Dependent Price and a Marine Reserve",
        people: "<b>Le Canh Hai</b> · supervised by Prof. Ali Moussaoui",
        venue: "COSMOS Lab, VinUniversity · since Sep 2026",
        keywords: ["Rarity-dependent price", "Hopf bifurcation", "Aggregation of variables", "Marine protected area", "Maximum sustainable yield"],
        tags: [{ text: "In preparation", tone: "coral" }],
        links: [{ text: "manuscript coming soon" }],
        bullets: [
          "Open-access fishery models in which the price <span class='m'>p(N) = a + b/N</span> rises as fish biomass <span class='m'>N</span> falls, with bilinear or saturated catch, each with and without a marine reserve.",
          "Equilibria, local and global stability, maximum sustainable yield and Hopf bifurcation thresholds; the reserve models are reduced by aggregation of variables.",
          "With saturated catch, lowering the cost of fishing effort turns a stable equilibrium into sustained oscillations. The panel below simulates this model.",
        ],
        diagram: "fishery",
      },
      {
        year: 2026,
        title: "A Relaxed Golden-Ratio Extragradient Algorithm for Variational Inequalities without Monotonicity",
        people: "<b>Le Canh Hai</b> · joint work supervised by Assoc. Prof. Nguyen Thi Thu Thuy",
        venue: "Hanoi University of Science and Technology",
        keywords: ["Variational inequality", "Golden-ratio extragradient", "Non-monotone operators", "Alternated inertia", "Error bound"],
        tags: [{ text: "In preparation", tone: "coral" }],
        links: [],
        bullets: [
          "Co-developed a golden-ratio extragradient method with <b>alternated inertia</b> and adaptive step sizes that need no Lipschitz constant, for problems without monotonicity.",
          "Weak convergence proved via the dual variational inequality, and an <b>R-linear rate</b> under an error bound.",
          "In numerical experiments the method needed fewer iterations and less CPU time than several compared algorithms, and it was applied to smart-grid demand-side management.",
        ],
      },
      {
        year: 2026,
        title: "A Self-Adaptive Inertial Algorithm for Split Variational Inequalities with Applications to Traffic Networks",
        people: "<b>Le Canh Hai</b> (first author and presenter) · thesis advisor: Assoc. Prof. Nguyen Thi Thu Thuy",
        venue: "43rd Student Research Conference, HUST (May 2026) · undergraduate thesis, graded 9.6/10",
        keywords: ["Split variational inequality", "Self-adaptive step size", "Monotone operator", "Traffic network equilibrium"],
        msc: "49J40 · 90C33 · 47H05 · 47H09",
        tags: [{ text: "Conference paper", tone: "gold" }, { text: "Thesis · 9.6/10", tone: "paper" }],
        links: [],
        abstract: "This paper investigates the split variational inequality problem in real Hilbert spaces. We propose a novel iterative algorithm that combines Tseng's modified forward–backward splitting method with an inertial extrapolation technique and self-adaptive step sizes. The proposed method requires only monotonicity and Lipschitz continuity of the operators, without assuming co-coerciveness. A key feature of the algorithm is that the step sizes are updated at each iteration via simple computations, eliminating the need for prior knowledge of the norm of the transfer operator or the Lipschitz constants. Strong convergence of the generated sequence is established under standard conditions. As an application, we model traffic network equilibrium as a split variational inequality problem and present numerical experiments to demonstrate the efficiency and practical implementability of the proposed method.",
        bullets: [
          "Combines Tseng's forward–backward–forward splitting with a <b>one-step inertial extrapolation</b> that builds the viscosity anchor into the inertial step: <span class='m'>w<sub>k</sub> = (1 − α<sub>k</sub>)x<sub>k</sub> + θ<sub>k</sub>(x<sub>k</sub> − x<sub>k−1</sub>)</span>.",
          "Needs only monotone, Lipschitz continuous operators (no co-coercivity). Self-adaptive step sizes remove any need to know the Lipschitz constants or the operator norm ‖F‖.",
          "Proves <b>strong convergence to the minimum-norm solution</b>, and introduces a two-phase, sigmoid-scheduled viscosity parameter α<sub>k</sub> for faster early progress.",
          "Models a time-dependent <b>two-city traffic network</b> as a split variational inequality. On the tested examples the method needed fewer iterations and less CPU time than the algorithms of Izuchukwu et al. (2020) and Pham et al. (2020).",
        ],
        diagram: "svi",
      },
    ],
  },

  /* ---------- Research interests ---------- */
  // kind: Theoretical | Analytical | Applied | Computational
  // flow icons: operator, projection, iterates, solution, equilibrium, jacobian,
  //   eigen, cycle, fish, assumptions, ode, msy, theorem, code, simulate,
  //   compare, momentum, split, step, network, price, boat, net, mpa, tseng, adjoint
  interests: [
    {
      title: "Optimization &amp; Variational Inequalities",
      kind: "Theoretical",
      topics: ["Optimization", "Functional Analysis"],
      when: "Since 2025",
      flow: [
        { icon: "operator", label: "operator B" },
        { icon: "projection", label: "projection", tone: "coral" },
        { icon: "iterates", label: "iterates", tone: "gold" },
        { icon: "solution", label: "solution x*", tone: "paper" },
      ],
      bullets: [
        "Projection, extragradient and Tseng-type methods for variational inequalities, including split and non-monotone problems, with inertial terms and adaptive step sizes.",
        "Proving convergence (strong, weak, or at an R-linear rate), then checking it numerically on traffic networks and smart-grid demand-side management.",
      ],
    },
    {
      title: "Nonlinear Dynamical Systems",
      kind: "Analytical",
      topics: ["Dynamical Systems", "Bifurcation Theory"],
      when: "Current",
      flow: [
        { icon: "equilibrium", label: "equilibrium" },
        { icon: "jacobian", label: "linearize" },
        { icon: "eigen", label: "eigenvalues", tone: "gold" },
        { icon: "cycle", label: "limit cycle", tone: "coral" },
      ],
      bullets: [
        "Local and global stability of equilibria, and the thresholds at which stability is lost.",
        "Hopf bifurcations: how a parameter change turns a steady state into sustained oscillations.",
      ],
    },
    {
      title: "Mathematical Modelling",
      kind: "Applied",
      topics: ["Bioeconomics", "Population Dynamics"],
      when: "Current",
      flow: [
        { icon: "fish", label: "real system" },
        { icon: "assumptions", label: "assumptions" },
        { icon: "ode", label: "ODE model", tone: "coral" },
        { icon: "msy", label: "insight", tone: "gold" },
      ],
      bullets: [
        "Bioeconomic fishery models with rarity-dependent prices, bilinear and saturated catch, and marine reserves.",
        "Turning what a model predicts (yield, stability, oscillations) into statements about the real system.",
      ],
    },
    {
      title: "Numerical Analysis &amp; Scientific Computing",
      kind: "Computational",
      topics: ["Numerical Methods", "Python · MATLAB"],
      when: "Ongoing",
      flow: [
        { icon: "theorem", label: "theorem", tone: "paper" },
        { icon: "code", label: "code" },
        { icon: "simulate", label: "simulation", tone: "gold" },
        { icon: "compare", label: "compare", tone: "coral" },
      ],
      bullets: [
        "Numerical experiments that test theoretical guarantees, implemented in Python and MATLAB.",
        "Comparing analytical thresholds with simulations, and explaining any gap through the mathematics.",
      ],
    },
  ],

  /* ---------- Experience ---------- */
  experience: [
    {
      group: "Research",
      items: [
        {
          when: "Sep 2026 – Present",
          title: "Research Assistant",
          org: "COSMOS Lab, VinUniversity",
          desc: "Fishery models with rarity-dependent prices: equilibria, stability, maximum sustainable yield and Hopf bifurcations. Supervisor: <span class='hl'>Prof. Ali Moussaoui</span>.",
        },
        {
          when: "Feb 2025 – Present",
          title: "Research Assistant",
          org: "Faculty of Mathematics and Informatics, HUST",
          desc: "Optimization algorithms for variational inequalities: a relaxed golden-ratio extragradient method (in preparation) and a self-adaptive inertial algorithm for split variational inequalities (conference paper and thesis). Supervisor: <span class='hl'>Assoc. Prof. Nguyen Thi Thu Thuy</span>.",
        },
      ],
    },
    {
      group: "Leadership &amp; Service",
      hidden: true, // not shown on the site; delete this line to show it again
      items: [
        {
          when: "Nov 2025",
          title: "HUST Representative",
          org: "“Red Journey” Vietnam–China Youth Cultural &amp; Academic Exchange",
          desc: "Represented HUST in academic and cultural exchanges with Chinese universities and youth organizations in Wuhan and Chongqing.",
        },
        {
          when: "2022 – Present",
          title: "Volunteer Tutor, then Tutoring Program Coordinator",
          org: "Chap Canh Bach Khoa Community",
          desc: "Taught and later coordinated a volunteer program giving free mathematics lessons to more than 50 secondary-school students in Mu Cang Chai, a remote mountainous area of northern Vietnam. As coordinator, organized volunteer tutors, schedules and communication with local schools.",
        },
      ],
    },
  ],

  /* ---------- Honors & Awards ---------- */
  honors: [
    { when: "2026", title: "Graduation Valedictorian", org: "Faculty of Mathematics and Informatics, HUST", desc: "Ranked 1st of 166 in the Mathematics and Informatics programme; GPA 3.89/4.00." },
    { when: "2024 – 2025", title: "University Outstanding Student", org: "Hanoi University of Science and Technology" },
    { when: "6 semesters", title: "HUST Academic Achievement Scholarship", org: "Hanoi University of Science and Technology", desc: "Awarded on academic results." },
    { when: "7 semesters", title: "“Chap Canh Bach Khoa” Scholarship", org: "Hanoi University of Science and Technology", desc: "For outstanding students facing financial hardship." },
    { when: "", title: "Outstanding Student Certificate for Academic and Research Excellence", org: "Faculty of Mathematics and Informatics, HUST (faculty level)" },
  ],

  /* ---------- Skills ---------- */
  skills: [
    { group: "Programming", items: ["Python", "MATLAB", "C/C++", "LaTeX"] },
    { group: "Mathematics", items: ["Optimization methods", "Variational inequalities", "Stability &amp; bifurcation analysis", "Numerical analysis", "PDEs", "Probability &amp; statistics"] },
    { group: "Languages", items: ["English: IELTS Academic 6.5 (2026)", "Vietnamese: native"] },
  ],

  /* ---------- Contact ---------- */
  contact: {
    title: "Thank you for visiting!",
    text: "I am always happy to talk about optimization, dynamical systems or mathematical modelling, whether you have a question, a collaboration idea, or an opportunity to share. Email is the best way to reach me.",
    // Optional visitor map: register at mapmyvisitors.com (or clustrmaps.com),
    // copy the src of their script tag and paste it below.
    visitorMap: { provider: "mapmyvisitors", src: "" },
  },
};
