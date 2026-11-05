export type Course = {
  shortName: string;
  fullName: string;
  description: string;
  school: string;
  term: string;
};

const csn = "College of Southern Nevada (CSN)";
const unlv = "University of Nevada, Las Vegas (UNLV)";

const courses: Course[] = [
  { shortName: "ENG 100", fullName: "Composition Enhanced", description: "A writing intensive course designed to strengthen college-level composition skills, with particular attention to audience, purpose, and context for writing focusing on the writing process and introducing research.", school: csn, term: "Fall 2021" },
  { shortName: "HIST 101", fullName: "U.S. History to 1877", description: "A survey of United States political, social, economic, diplomatic, and cultural development from colonial times to 1877. Satisfies the United States Constitution requirement.", school: csn, term: "Fall 2021" },
  { shortName: "MATH 181", fullName: "Calculus I", description: "Differentiation and integration of algebraic and transcendental functions with applications.", school: csn, term: "Fall 2021" },
  { shortName: "BIOL 190", fullName: "Introduction to Cell and Molecular Biology", description: "A study of the basic characteristics of living systems including the chemical and physical structure of cells, enzyme mechanics, metabolism, genetics, molecular biology principles and techniques, and evolution. This course is designed for science, biological science, and pre-professional majors.", school: csn, term: "Spring 2022" },
  { shortName: "MATH 182", fullName: "Calculus II", description: "Topics include further applications and techniques of integration with applications, polynomial approximations, sequences, and series.", school: csn, term: "Spring 2022" },
  { shortName: "PSC 101", fullName: "Introduction to American Politics", description: "A survey of the United States, national, state and local governments with emphasis on the cultural aspects of the governing process. Satisfies the legislative requirement for the United States and Nevada Constitutions.", school: csn, term: "Spring 2022" },
  { shortName: "SPAN 111", fullName: "First Year Spanish I", description: "A beginning level Spanish course emphasizing the development of language skills (listening, speaking, reading, and writing) and cultural understanding. Emphasis on basic communication.", school: csn, term: "Spring 2022" },
  { shortName: "COM 101", fullName: "Public Speaking", description: "Theory and practice in extemporaneous speaking and other prepared speaking experiences.", school: csn, term: "Summer 2022" },
  { shortName: "ENG 231", fullName: "World Literature I", description: "World Literature I explores literature from our earliest texts to c1651. Individual sections will include texts selected from around the world, and incorporate prose, poetry, and drama.", school: csn, term: "Summer 2022" },
  { shortName: "PSY 101", fullName: "General Psychology", description: "Introduction to the principles of psychology, including sensation, perception, cognition, learning, physiological psychology, personality, development, psychopathology, social psychology, methodology, assessment, and history of psychology.", school: csn, term: "Summer 2022" },
  { shortName: "BIOL 191", fullName: "Introduction to Organismal Biology", description: "A survey of major groups of organisms presented in an evolutionary context, including natural selection, biodiversity, structure and function, reproduction, physiology, and ecology. This course includes a lab.", school: csn, term: "Fall 2022" },
  { shortName: "CHEM 121", fullName: "General Chemistry I", description: "An investigation of the fundamental structure of matter and chemical terminology. Introduces topics such as solution chemistry, thermochemistry and gas laws. Designed for science and pre-professional majors.", school: csn, term: "Fall 2022" },
  { shortName: "CS 135", fullName: "Computer Science I", description: "This course is intended for students in computer science or engineering majors. It covers: a) Program development in a complex operating environment; b) Problem-solving methods and algorithm development in a high-level programming language; c) Program design, coding, debugging, and documentation using techniques of a good programming style.", school: csn, term: "Fall 2022" },
  { shortName: "MATH 251", fullName: "Discrete Mathematics I", description: "Topics include fundamental principles of logic and proof methods, elements of set theory, equivalence relations and partitions, counting techniques, mathematical induction, cardinality, power set, inclusion-exclusion principle, Cartesian product, pigeonhole principle, binomial theorem, probability and expectation.", school: csn, term: "Fall 2022" },
  { shortName: "PHYS 151", fullName: "General Physics I", description: "General physics primarily for students in Arts and Science, medicine and agriculture. Includes study of mechanics, sound, and heat. A knowledge of right angle trigonometry is desired.", school: csn, term: "Fall 2022" },
  { shortName: "CPE 100", fullName: "Digital Logic Design I", description: "Logic gates. Simplification of Boolean functions. Design and testing of combinational and sequential circuits including code converters, multiplexers, adders, and synchronous counters.", school: csn, term: "Spring 2023" },
  { shortName: "CS 202", fullName: "Computer Science II", description: "This course is the continuation of CS 135. It covers: a) Data structures and algorithms for manipulating linked lists; b) String and file processing; c) Recursion. Software engineering, structured programming and testing, especially larger programs are also covered in this course.", school: csn, term: "Spring 2023" },
  { shortName: "EE 220", fullName: "Circuits I", description: "This course is an introduction to linear circuit analysis. It covers Kirchhoff's laws, node and loop analysis, Thevenin, Norton, and other circuit network theorems, operational amplifiers, first order RL and RC circuits, second order RLC circuits.", school: csn, term: "Spring 2023" },
  { shortName: "EE 220D", fullName: "Circuits I Discussion", description: "This course covers: 1) Solving electrical circuit problems using PSpice, 2) Solve electrical problems using Multisim, and 3) Build and test simulated circuits. It is a 0-credit discussion section and corequisite of EE 220.", school: csn, term: "Spring 2023" },
  { shortName: "PHYS 180", fullName: "Physics for Scientists and Engineers I", description: "Lecture in Newtonian mechanics. Covers rectilinear motion, particle dynamics, work and energy, momentum and collision, rotational mechanics, oscillations, wave motion, and gravitation.", school: csn, term: "Spring 2023" },
  { shortName: "PHYS 180L", fullName: "Physics for Scientists and Engineers Lab I", description: "Laboratory exercises in Newtonian mechanics. Covers rectilinear motion, particle dynamics, work and energy, momentum and collision, rotational mechanics, oscillations, wave motion, and gravitation.", school: csn, term: "Spring 2023" },
  { shortName: "SOC 101", fullName: "Principles of Sociology", description: "An overview of the sociological principles that shape the development, structure and function of society, culture, human interaction, groups and social change.", school: csn, term: "Spring 2023" },
  { shortName: "CS 218", fullName: "Introduction to Systems Programming", description: "Algorithms from systems programming including conversion, buffering, device drivers, assemblers and loaders. Use of system services, macros, and linkage conventions, with laboratory exercises programmed in assembly language.", school: unlv, term: "Fall 2023" },
  { shortName: "CS 302", fullName: "Data Structures", description: "Introduction to sequential and linked structures, including stacks, queues, trees, and graphs, and file access including sequential and indexed sequential organizations. Algorithms for implementing and manipulating structured objects, with Big-O notation.", school: unlv, term: "Fall 2023" },
  { shortName: "ENG 407B", fullName: "Fundamentals of Technical Writing", description: "Examines the rhetorical principles and composing practices necessary for writing effective technical documents and the role of writing in technical and industrial settings.", school: unlv, term: "Fall 2023" },
  { shortName: "STAT 411", fullName: "Statistical Methods I", description: "Collection and representation of information; elements of probability; Bernoulli trials, hypergeometric, binomial, Poisson and normal distributions; statistical sampling, estimation; testing hypotheses; and parametric procedures for one-sample and two-sample problems.", school: unlv, term: "Fall 2023" },
  { shortName: "CS 219", fullName: "Computer Organization", description: "Basic organization of digital computers, including I/O units, arithmetic logic units, control units, and memory organization. Number and character representations, instruction sets and addressing, and microprogramming.", school: unlv, term: "Spring 2024" },
  { shortName: "CS 301", fullName: "Social Implications of Computer Technology", description: "In-depth examination of moral and ethical issues created by advancing computer technology, including malfunction liability, privacy, power, ownership and intellectual property. Review of ethical theories and discussion of social trends and their possible effects.", school: unlv, term: "Spring 2024" },
  { shortName: "MATH 283", fullName: "Calculus III", description: "Vectors; differentiation and integration of vector valued functions; multivariable calculus; partial derivatives; multiple integrals and applications; line, surface and volume integrals; Green's theorem; divergence theorem; and Stokes' theorem.", school: unlv, term: "Spring 2024" },
  { shortName: "MATH 303", fullName: "Introduction to Proofs in Metric Spaces and Analysis", description: "Proofs presented in context of logic, set theory, topology of metric spaces, sequences and functions, limits and continuity, at the introductory level.", school: unlv, term: "Spring 2024" },
  { shortName: "STAT 412", fullName: "Statistical Methods II", description: "Regression analysis; importance and essentials of statistically designed experiments, completely randomized design, randomized block design, factorial design, and statistical quality control.", school: unlv, term: "Spring 2024" },
  { shortName: "CS 370", fullName: "Operating Systems", description: "Operating systems organization, sharing and allocation of system resources, protection mechanisms, and integration of system components.", school: unlv, term: "Summer 2024" },
  { shortName: "MATH 283", fullName: "Calculus III", description: "Vectors; differentiation and integration of vector valued functions; multivariable calculus; partial derivatives; multiple integrals and applications; line, surface and volume integrals; Green's theorem; divergence theorem; and Stokes' theorem.", school: unlv, term: "Summer 2024" },
  { shortName: "MATH 365", fullName: "Computational Linear Algebra", description: "Matrices, linear systems of equations, linear programming, least-squares approximations, determinants, eigenvalues and eigenvectors, matrix inversion, elimination, iteration and other algorithms, precision and error analysis, and computational cost of algorithms. Emphasizes practical methods using computer algorithms.", school: unlv, term: "Summer 2024" },
  { shortName: "PHIL 114", fullName: "Introduction to Symbolic Logic", description: "Principles of correct reasoning, using modern symbolic techniques of propositional calculus and simple quantification.", school: unlv, term: "Summer 2024" },
  { shortName: "CS 326", fullName: "Programming Languages, Concepts and Implementation", description: "Design, evaluation and implementation of programming languages, including data types and data abstraction, sequence control and procedural abstraction, parameter passing, scope rules, referencing environments and run-time storage management. Study and evaluation of a number of current programming languages.", school: unlv, term: "Fall 2024" },
  { shortName: "CS 456", fullName: "Automata and Formal Languages", description: "Regular expressions; regular, context-free, and unrestricted grammars; finite and pushdown automata. Turing machines and the halting problem, with an introduction to decidability.", school: unlv, term: "Fall 2024" },
  { shortName: "MATH 453", fullName: "Abstract Algebra I", description: "Sets, functions, groups, quotient groups, homomorphism theorems, Abelian groups, rings, polynomial rings, division rings, Euclidean domains, fields and vector spaces.", school: unlv, term: "Fall 2024" },
  { shortName: "MATH 457", fullName: "Introduction to Real Analysis I", description: "Topics include finite and infinite sets, axiomatic study of real numbers, topology of Cartesian spaces, sequences of functions, continuous functions, and differentiation of functions of one variable.", school: unlv, term: "Fall 2024" },
  { shortName: "CS 405", fullName: "Analysis and Presentation", description: "Focuses on Data Science and Big Data concepts: analyzing large sets of data, identifying trends, and sharing results with other people. Develops methods of data analysis, including traditional statistical methods and contemporary machine learning and artificial intelligence techniques, with core principles for presenting results clearly and intuitively.", school: unlv, term: "Spring 2025" },
  { shortName: "CS 460", fullName: "Compiler Construction", description: "Current methods in the design and implementation of compilers. Construction of the components of an actual compiler as a term project.", school: unlv, term: "Spring 2025" },
  { shortName: "CS 789", fullName: "Topics in Advanced Computer Science (Empirical Methods)", description: "Graduate-level course in some field of computer science, at advanced level, depending upon the current interest of the staff and the students. The transcript topic was Empirical Methods; that is the specific topic offering, not the catalog title.", school: unlv, term: "Spring 2025" },
  { shortName: "MATH 454", fullName: "Abstract Algebra II", description: "Sets, functions, groups, quotient groups, homomorphism theorems, Abelian groups, rings, polynomial rings, division rings, Euclidean domains, fields and vector spaces.", school: unlv, term: "Spring 2025" },
  { shortName: "CS 490", fullName: "Independent Study", description: "Library research and reports on topics of computer science interest.", school: unlv, term: "Summer 2025" },
  { shortName: "MATH 427", fullName: "Differential Equations I", description: "Theory and solution techniques for solving ordinary differential equations with constant and variable coefficients, systems of linear differential equations, Laplace transform, difference equations and numerical methods. Fourier series, stability theory and autonomous systems.", school: unlv, term: "Summer 2025" },
  { shortName: "PHIL 422", fullName: "Advanced Logic", description: "Study of formal logic through first-order logic with identity, including soundness, completeness, compactness and other metatheorems. Other topics may include computability, modal logic, epistemic logic, many-valued logic, the logic of conditionals, higher-order logics, infinitary logics or non-monotonic logics, number theory, Godel's theorems, and the limits of logicism.", school: unlv, term: "Summer 2025" },
  { shortName: "CS 440", fullName: "Autonomous Racing", description: "Building algorithms for a 1/10th-scale autonomous car using LiDAR, GPS and camera components to navigate and race. (Note: this description is paraphrased from a UNLV news article; CS 440 was not found in the UNLV catalog, where the same course is listed as CS 489/689.)", school: unlv, term: "Fall 2025" },
  { shortName: "CS 477", fullName: "Analysis of Algorithms", description: "Analysis of the time and space complexity of algorithms, techniques for efficient algorithm design, and the effect of structure choice on efficiency. Fast algorithms for set, graph and matrix manipulations, pattern matching, sorting, and storage organization, plus exponential time problems and an introduction to NP-completeness.", school: unlv, term: "Fall 2025" },
  { shortName: "CS 490", fullName: "Independent Study", description: "Library research and reports on topics of computer science interest.", school: unlv, term: "Fall 2025" },
  { shortName: "MATH 480", fullName: "College Geometry", description: "Study of advanced geometrical topics using the methods of proof of elementary geometry.", school: unlv, term: "Fall 2025" },
  { shortName: "CS 442", fullName: "Cloud Computing", description: "Exploration of cloud computing services, their use cases and applications, and an overview of best practices including security, scalability, and global infrastructure, along with preparation for cloud computing professional certifications.", school: unlv, term: "Spring 2026" },
  { shortName: "CS 472", fullName: "Software Product Design and Development I", description: "Current techniques in software design presented with emphasis on architecture first development. Introduction to the processes involved in development, with practice in architectural design through homework problems and team preparation of a software product architecture.", school: unlv, term: "Spring 2026" },
];

function slugFor(course: Course): string {
  return `${course.shortName} ${course.term}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function courseworkCatalog() {
  return courses.map((course, index) => ({
    id: 1_000_000 + index,
    kind: "coursework" as const,
    slug: slugFor(course),
    title: course.fullName,
    subtitle: `${course.shortName} · ${course.term} · ${course.school}`,
    shortDescription: course.description,
    longDescription: course.description,
    imagePath: null,
    linkUrl: null,
    startedOn: null,
    endedOn: null,
    sortOrder: index,
    skills: [],
    shortName: course.shortName,
    fullName: course.fullName,
    description: course.description,
    school: course.school,
    term: course.term,
  }));
}
