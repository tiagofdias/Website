import {
  mobile,
  backend,
  creator,
  web,
  meta,
  junta,
  tesla,
  shopify,
  Consulteware,
  jobit,
  StickHero,
  tripguide,
  Condomix,
  Automix,
  tax,
  tucano,
  memorygame,
  weather,
  currency,
  DIGI,
  investorcalculator,
  rockpaperscissors,
  typing,
  specialistmaster2016,
  access2016,
  excel2019,
  powerpoint2016,
  word2019,
  LADrivingSchool,
  mtadatabaseadministration,
  mtahtml5,
  mtahtmlandcss,
  mtanetworkingfundamentals,
  mtasecurityfundamentals,
  mtasoftwarefundamentals,
  mtawindowsos,
  mtawindowsserver,
  digitalmarketing,
  SonarLogin,
  SonarChat,
  SonarProfile,
  SonarSettings,
  LAclasses,
  LAFAQ,
  LAcontacts,
  LAtestimonials,
  CondomixSettingssecurity,
  CondomixSettingsprofile,
  CondomixSearchworkers,
  CondomixRoles,
  CondomixMainpage,
  CondomixFluxograma,
  CondomixEmail,
  CondomixCondominios,
  CondomixAddfuncionario,
  Condomix2faOFF,
  excel2016,
  excelexpert2016,
  word2016,
  wordexpert2016,
  excel2013,
  word2013,
  access2013,
} from "../assets";

export const navLinks = [
  {
    id: "projects",
    title: "Projects",
  },
  {
    id: "certifications",
    title: "Certifications",
  },
  {
    id: "about",
    title: "About Me",
  },
  {
    id: "blog",
    title: "Blog",
  },
  {
    id: "contact",
    title: "Contact Me",
  },
];

const services = [
  {
    title: "Microsoft Office Specialist Master 2016",
    icon: web,
  },
  {
    title:
      "Microsoft Technology Associate for Software Development Fundamentals",
    icon: mobile,
  },
  {
    title: "Microsoft Technology Associate for Security Fundamentals",
    icon: backend,
  },
  {
    title:
      "Microsoft Technology Associate for Database Administration Fundamentals",
    icon: creator,
  },
];

const articles = [
  {
    title: "A Beginner-Friendly Guide to REST APIs",
    contentFile: "articles/rest_api_guide.txt",
    image:
      "articles/images/rest.jpg",
  },
  {
    title: "Understanding the MVC Architecture: A Comprehensive Guide",
    contentFile: "articles/MVC_Architecture.txt",
    image:
      "articles/images/mvc.jpg",
  },
  {
    title: "Agile vs Scrum Methodologies",
    contentFile: "articles/Scrum_vs_Agile.txt",
    image:
      "articles/images/avss.jpg",
  },
  {
    title: "Introduction to Docker and Its Practical Usage",
    contentFile: "articles/Docker.txt",
    image:
      "articles/images/docker.jpg",
  },
  {
    title: "Git and Its Essential Commands",
    contentFile: "articles/git.txt",
    image:
      "articles/images/git.png",
  },
  {
    title: "Examination of JSON Web Tokens (JWT)",
    contentFile: "articles/jwt.txt",
    image:
      "articles/images/jwt.png",
  },
];

const experiences = [
  {
    title: "Master's degree in Computer Science",
    titleLink: "https://www.istec.pt/index.php/en/master-in-computer-science/",
    company_name: "ISTEC - Higher Institute of Advanced Technologies",
    companyLink: "https://www.istec.pt/",
    icon: shopify,
    iconBg: "#383E56",
    date: "Oct 2022 - Present",
    points: [
      {
        text: "European Qualifications Framework Level 7",
        link: "https://www.lsib.co.uk/2022/answers.aspx?id=1045&CourseTitle=What+is+eqf+level+of+bachelor%27s+degree%3F",
      },
    ],
  },
  {
    title: "Bachelor's degree in Computer Science",
    titleLink:
      "https://www.istec.pt/index.php/en/eng_licenciatura-em-informatica/",
    company_name: "ISTEC - Higher Institute of Advanced Technologies",
    companyLink: "https://www.istec.pt/",
    icon: shopify,
    iconBg: "#383E56",
    date: "Sep 2019 - Oct 2021",
    points: [
      {
        text: "European Qualifications Framework Level 6",
        link: "https://www.lsib.co.uk/2022/answers.aspx?id=1045&CourseTitle=What+is+eqf+level+of+bachelor%27s+degree%3F",
      },
    ],
  },
  {
    title: ".NET Developer (Internship)",
    titleLink: null,
    company_name: "Consulteware",
    companyLink: "https://consulteware.com/",
    icon: Consulteware,
    iconBg: "#383E56",
    date: "Mar 2019 - Aug 2019",
    points: [
      {
        text: "Focused on developing a time clock management system for small businesses.",
      },
      {
        text: "Utilized Visual Basic, C#, and T-SQL within the .NET framework to design a robust, user-friendly solution tailored for small enterprises.",
      },
      {
        text: "Gained valuable experience in relational databases, optimizing queries for efficient data management.",
      },
    ],
  },
  {
    title: "Superior Vocational Course in Computer Science Management",
    titleLink:
      "https://www.istec.pt/index.php/en/ctesp-management-informatics/",
    company_name: "ISTEC - Higher Institute of Advanced Technologies",
    companyLink: "https://www.istec.pt/",
    icon: shopify,
    iconBg: "#383E56",
    date: "Sep 2017 - Aug 2019",
    points: [
      {
        text: "European Qualifications Framework Level 5",
        link: "https://www.lsib.co.uk/2022/answers.aspx?id=1045&CourseTitle=What+is+eqf+level+of+bachelor%27s+degree%3F",
      },
    ],
  },
  {
    title: "IT Help Desk Technician (Internship)",
    titleLink: null,
    company_name: "OGMA - Aeronautics Industry of Portugal, S.A.",
    companyLink: "https://www.ogma.pt/",
    icon: tesla,
    iconBg: "#383E56",
    date: "Apr 2017 - Jul 2017",
    points: [
      {
        text: "Collaborated with Capgemini professionals to resolve complex IT tickets.",
      },
      {
        text: "Performed Windows OS formatting and configuration to maintain high performance and security standards.",
      },
      {
        text: "Gained hands-on experience in hardware repairs, broadening technical expertise.",
      },
    ],
  },
  {
    title: "Frontend Developer (Internship)",
    titleLink: null,
    company_name: "Parish Council of Póvoa de Santa Iria and Forte da Casa",
    companyLink: "https://jf-povoaforte.pt/",
    icon: junta,
    iconBg: "#383E56",
    date: "May 2016 - Jun 2016",
    points: [
      {
        text: "Contributed to the development of the local parish council's website.",
      },
      {
        text: "Implementing responsive design and ensuring cross-browser compatibility.",
      },
      {
        text: "Participating in code reviews and providing constructive feedback to other developers.",
      },
      {
        text: "Designed and implemented user-friendly interfaces with HTML and CSS.",
      },
      { text: "Used JavaScript to enhance functionality and interactivity." },
      {
        text: "Gained experience in problem-solving and maintaining strong interpersonal relationships.",
      },
    ],
  },
  {
    title: "Vocation Course in Programming and Management of IT Systems",
    titleLink: "https://portal.aefc.edu.pt/2017/06/15/programacao/",
    company_name: "Forte da Casa High School",
    companyLink: "https://portal.aefc.edu.pt/",
    icon: meta,
    iconBg: "#383E56",
    date: "Sep 2015 - Aug 2017",
    points: [
      {
        text: "European Qualifications Framework Level 4",
        link: "https://www.lsib.co.uk/2022/answers.aspx?id=1045&CourseTitle=What+is+eqf+level+of+bachelor%27s+degree%3F",
      },
    ],
  },
];
const education = [
  {
    title: "Master's degree in Computer Science",
    titleLink: "https://www.istec.pt/index.php/en/master-in-computer-science/",
    company_name: "ISTEC - Higher Institute of Advanced Technologies",
    companyLink: "https://www.istec.pt/",
    icon: shopify,
    iconBg: "#383E56",
    date: "Oct 2022 - Present",
    points: [
      {
        text: "European Qualifications Framework Level 7",
        link: "https://www.lsib.co.uk/2022/answers.aspx?id=1045&CourseTitle=What+is+eqf+level+of+bachelor%27s+degree%3F",
      },
    ],
  },
  {
    title: "Bachelor's degree in Computer Science",
    titleLink:
      "https://www.istec.pt/index.php/en/eng_licenciatura-em-informatica/",
    company_name: "ISTEC - Higher Institute of Advanced Technologies",
    companyLink: "https://www.istec.pt/",
    icon: shopify,
    iconBg: "#383E56",
    date: "Sep 2019 - Oct 2021",
    points: [
      {
        text: "European Qualifications Framework Level 6",
        link: "https://www.lsib.co.uk/2022/answers.aspx?id=1045&CourseTitle=What+is+eqf+level+of+bachelor%27s+degree%3F",
      },
    ],
  },
  {
    title: "Superior Vocational Course in Computer Science Management",
    titleLink:
      "https://www.istec.pt/index.php/en/ctesp-management-informatics/",
    company_name: "ISTEC - Higher Institute of Advanced Technologies",
    companyLink: "https://www.istec.pt/",
    icon: shopify,
    iconBg: "#383E56",
    date: "Sep 2017 - Aug 2019",
    points: [
      {
        text: "European Qualifications Framework Level 5",
        link: "https://www.lsib.co.uk/2022/answers.aspx?id=1045&CourseTitle=What+is+eqf+level+of+bachelor%27s+degree%3F",
      },
    ],
  },
  {
    title: "Vocation Course in Programming and Management of IT Systems",
    titleLink: "https://portal.aefc.edu.pt/2017/06/15/programacao/",
    company_name: "Forte da Casa High School",
    companyLink: "https://portal.aefc.edu.pt/",
    icon: meta,
    iconBg: "#383E56",
    date: "Sep 2015 - Aug 2017",
    points: [
      {
        text: "European Qualifications Framework Level 4",
        link: "https://www.lsib.co.uk/2022/answers.aspx?id=1045&CourseTitle=What+is+eqf+level+of+bachelor%27s+degree%3F",
      },
    ],
  },
];

const proexp = [
  {
    title: ".NET Developer (Internship)",
    titleLink: null,
    company_name: "Consulteware",
    companyLink: "https://consulteware.com/",
    icon: Consulteware,
    iconBg: "#383E56",
    date: "Mar 2019 - Aug 2019",
    points: [
      {
        text: "Architected a time clock system with the IT team, slashing data retrieval times by 30% via SQL queries.",
      },
      {
        text: "Engineered CRUD operations for real-time tracking of 5,000+ monthly employee hours and shifts.",
      },
      {
        text: "Achieved 100% reporting accuracy by enforcing precise business logic and data validation in C#.",
      },
      {
        text: "Spearheaded cross-functional database optimizations using C#, guiding junior developers in strategic query refinements that reduced response times by 40% while aligning with team-driven goals.",
      },
      {
        text: "Teamed with the QA department to integrate C# and SQL time clock logic, eliminating discrepanciesthrough collaborative testing and feedback loops.",
      },
    ],
  },
  {
    title: "IT Help Desk Technician (Internship)",
    titleLink: null,
    company_name: "OGMA - Aeronautics Industry of Portugal, S.A.",
    companyLink: "https://www.ogma.pt/",
    icon: tesla,
    iconBg: "#383E56",
    date: "Apr 2017 - Jul 2017",
    points: [
      {
        text: "Collaborated with Capgemini IT professionals to resolve an average of 15 IT tickets daily.",
      },
      {
        text: "Led an IT initiative to deploy 100+ Windows OS installations and PC formatting upgrades, analyzing user needs to streamline workflows and mentor other junior technicians in best practices.",
      },
      {
        text: "Diagnosed and resolved hardware failures for over 20 machines through hands-on troubleshooting.",
      },
      {
        text: "Automated IT ticket tracking and trend analysis in Excel via VBA and macros, boosting efficiency by 50%.",
      },
      {
        text: "Co-developed a shared Excel dashboard with Capgemini technicians to track recurring hardware/software issues, enabling real-time team collaboration and cutting resolution time by 25%",
      },
      {
        text: "Led 2 business analysts to automate repetitive process flows using Excel Macros / VBA and reduce analysis time by 2+ hours per week.",
      },
    ],
  },
  {
    title: "Frontend Developer (Internship)",
    titleLink: null,
    company_name: "Parish Council of Póvoa de Santa Iria and Forte da Casa",
    companyLink: "https://jf-povoaforte.pt/",
    date: "May 2016 - Jun 2016",
    points: [
      {
        text: "Partnered with parish council members to redesign the website using HTML5 and responsive design, improving accessibility for 40,000+ residents.",
      },
      {
        text: "Upgraded site navigation and form validation, lifting engagement by 20% and halving submission errors",
      },
      {
        text: "Boosted page speed 15% via optimized CSS and reduced render-blocking elements.",
      },
      {
        text: "Integrated jQuery and Chart.js to accelerate feature development by 20%.",
      },
    ],
  },
];

const projects = [
  {
    name: "Sonar",
    description:
      "Sonar is a real-time chat app for secure messaging, live user status, and a sleek, responsive UI with fast, reliable performance.",
    tags: [
      {
        name: "node",
      },
      {
        name: "express",
      },
      {
        name: "react",
      },
      {
        name: "tailwind",
      },
      {
        name: "mongodb",
      },
      {
        name: "socket.io",
      },
      {
        name: "json web token",
      },
    ],
    images: [SonarChat, SonarLogin, SonarProfile, SonarSettings],
    source_code_link: "https://github.com/tiagofdias/Sonar",
    source_code_link2: "https://sonar-3n5z.onrender.com/",
    WebsiteText: "Play Typing Game",
  },
  {
    name: "LA Driving School",
    description:
      "A user-friendly landing page for a Los Angeles driving school, showcasing expert and confident instructors, detailed lessons, and a seamless enrollment process for easy lesson booking.",
    tags: [
      {
        name: "react",
      },
      {
        name: "tailwind",
      },
      {
        name: "shadcn",
      },
    ],
    images: [LADrivingSchool, LAclasses, LAcontacts, LAFAQ, LAtestimonials],
    source_code_link: "https://github.com/tiagofdias/LA-Driving-School",
    source_code_link2: "https://la-driving-school.vercel.app/",
  },
  {
    name: "Condomix",
    description:
      "A .NET WinForms condominium management system built by using the Portuguese Citizen Card API integration, featuring nine different modules with full CRUD operations and validations.",
    tags: [
      {
        name: "c#",
      },
      {
        name: "t-sql",
      },
      {
        name: "winforms",
      },
    ],
    images: [
      Condomix,
      CondomixCondominios,
      CondomixMainpage,
      CondomixSettingsprofile,
      CondomixSettingssecurity,
      Condomix2faOFF,
      CondomixEmail,
      CondomixAddfuncionario,
      CondomixFluxograma,
      CondomixRoles,
      CondomixSearchworkers,
    ],
    source_code_link: "https://github.com/tiagofdias/Condomix",
  },
  {
    name: "Non Invested Money Interest Calculator",
    description:
      "An app designed to automate payment calculations, currency conversions, and tax reporting for your non-invested money, providing a solution to ensure precise calculations. By reducing human errors and eliminating effort, it simplifies math tasks.",
    tags: [
      {
        name: "html",
      },
      {
        name: "css",
      },
      {
        name: "javascript",
      },
    ],
    images: [tax],
    source_code_link:
      "https://github.com/tiagofdias/Non-Invested-Money-Interest-Calculator",
    source_code_link2:
      "https://tiagofdias.github.io/Non-Invested-Money-Interest-Calculator/",
  },
  {
    name: "Flappy Bird",
    description:
      "Guide a small, determined bird through a series of green pipes by tapping to make it flap its wings and fly. Each time the bird successfully passes through a gap in the pipes, you score points. The game is simple but highly addictive, offering a challenging test of your timing and coordination. Every second, the game becomes more intense.",
    tags: [
      {
        name: "html",
      },
      {
        name: "css",
      },
      {
        name: "javascript",
      },
    ],
    images: [jobit],
    source_code_link:
      "https://github.com/tiagofdias/FlappyBird?tab=readme-ov-file",
    source_code_link2: "https://tiagofdias.github.io/FlappyBird/",
  },
  {
    name: "Automix",
    description:
      "Automix for driving schools is a comprehensive platform designed to track student progress, optimize lesson planning, and effectively organize exam routes, providing seamless coordination between students, instructors, and school administrators for a more efficient and personalized learning experience.",
    tags: [
      {
        name: "c#",
      },
      {
        name: "asp.net core",
      },
      {
        name: "entity framework",
      },
    ],
    images: [Automix],
    source_code_link: "https://github.com/tiagofdias/Condomix",
  },
  {
    name: "Stick Hero",
    description:
      "Control a character by building bridges across platforms. Tap to stretch a stick and release to reach the next platform.",
    tags: [
      {
        name: "html",
      },
      {
        name: "css",
      },
      {
        name: "javascript",
      },
    ],
    images: [StickHero],
    source_code_link: "https://github.com/tiagofdias/Stick-Hero",
    source_code_link2: "https://tiagofdias.github.io/Stick-Hero/",
  },
  {
    name: "Memory Game",
    description:
      "Flip cards to find matching pairs and complete the board. Replay anytime to challenge your memory skills!",
    tags: [
      {
        name: "react",
      },
      {
        name: "tailwind",
      },
    ],
    images: [memorygame],
    source_code_link: "https://github.com/tiagofdias/MemoryGame",
    source_code_link2: "https://tiagofdias.github.io/MemoryGame/",
  },
  {
    name: "Rock Paper Scissors",
    description:
      "Play the classic game against the computer, with random choices and score tracking. A reset button lets you start fresh anytime.",
    tags: [
      {
        name: "html",
      },
      {
        name: "css",
      },
      {
        name: "javascript",
      },
    ],
    images: [rockpaperscissors],
    source_code_link: "https://github.com/tiagofdias/Rock-Paper-Scissors",
    source_code_link2: "https://tiagofdias.github.io/Rock-Paper-Scissors/",
  },
  {
    name: "Interest Calculator",
    description:
      "A responsive web app that calculates compound interest and displays results in an interactive chart.",
    tags: [
      {
        name: "html",
      },
      {
        name: "css",
      },
      {
        name: "javascript",
      },
      {
        name: "chart.js",
      },
    ],
    images: [investorcalculator],
    source_code_link: "https://github.com/tiagofdias/Investor-Calculator",
    source_code_link2: "https://tiagofdias.github.io/Investor-Calculator/",
  },
  {
    name: "Comparador DIGI",
    description:
      "A comparison tool to help Portuguese consumers calculate potential savings when switching to DIGI Portugal.",
    tags: [
      {
        name: "html",
      },
      {
        name: "css",
      },
      {
        name: "javascript",
      },
    ],
    images: [DIGI],
    source_code_link: "https://github.com/tiagofdias/Comparador-DIGI",
    source_code_link2: "https://tiagofdias.github.io/Comparador-DIGI/",
  },
  {
    name: "Currency Converter",
    description:
      "This web app allows users to convert an amount from one currency to another, with real-time exchange rate data.",
    tags: [
      {
        name: "html",
      },
      {
        name: "css",
      },
      {
        name: "javascript",
      },
      {
        name: "exchange api",
      },
    ],
    images: [currency],
    source_code_link: "https://github.com/tiagofdias/Currency-Converter",
    source_code_link2: "https://tiagofdias.github.io/Currency-Converter/",
  },
  {
    name: "Typing Game",
    description:
      "Boost your typing speed and accuracy with a variety of random quotes, all while tracking your progress and performance to ensure continuous improvement.",
    tags: [
      {
        name: "html",
      },
      {
        name: "css",
      },
      {
        name: "javascript",
      },
      {
        name: "quotes api",
      },
    ],
    images: [typing],
    source_code_link: "https://github.com/tiagofdias/Typing-Game",
    source_code_link2: "https://tiagofdias.github.io/Typing-Game/",
  },
  {
    name: "Weather Forecast",
    description:
      "This is a web application that provides a 5-day weather forecast for any city. The app uses the WeatherAPI to fetch weather data and display it dynamically.",
    tags: [
      {
        name: "html",
      },
      {
        name: "css",
      },
      {
        name: "javascript",
      },
      {
        name: "weather api",
      },
    ],
    images: [weather],
    source_code_link: "https://github.com/tiagofdias/Weather-Forecast",
    source_code_link2: "https://tiagofdias.github.io/Weather-Forecast/",
  },
  {
    name: "Password Generator",
    description:
      "Create strong, secure passwords with customizable options for length, uppercase and lowercase letters, numbers, and special characters.",
    tags: [
      {
        name: "html",
      },
      {
        name: "css",
      },
      {
        name: "javascript",
      },
    ],
    images: [tripguide],
    source_code_link: "https://github.com/tiagofdias/Password-Generator",
    source_code_link2: "https://tiagofdias.github.io/Password-Generator/",
  },
  {
    name: "Tucano Discord Bot",
    description:
      "A bot designed to optimize server management with automated message deletion, role management, and member engagement. Key features include an XP system, rank rewards, automated role assignments, suggestions, birthday reminders, and content publishing, enhancing user experience.",
    tags: [
      {
        name: "node.js",
      },
      {
        name: "discord.js",
      },
      {
        name: "sqlite",
      },
    ],
    images: [tucano],
    source_code_link: "https://github.com/tiagofdias/TucanoBot",
  },
];

const certifications = [
  {
    name: "MOS: 2016 Master",
    description: `
        MOS 2016 Master is the highest Microsoft Office certification, demonstrating advanced expertise in Excel, Word, PowerPoint, and Access. It is globally recognized.
      `,
    tags: [
      {
        name: "excel",
        link: "certifications/Microsoft Office Excel® 2016 Expert.pdf",
        color: "green-text-gradient",
      },
      {
        name: "word",
        link: "certifications/Microsoft Office Word 2016 Expert.pdf",
        color: "blue-text-gradient",
      },
      {
        name: "powerpoint",
        link: "certifications/Microsoft Office PowerPoint® 2016.pdf",
        color: "orange-text-gradient",
      },
      {
        name: "access",
        link: "certifications/Microsoft Office Access 2016.pdf",
        color: "red-text-gradient",
      },
    ],
    images: [
      specialistmaster2016,
      excel2016,
      excelexpert2016,
      word2016,
      wordexpert2016,
      access2016,
      powerpoint2016,
    ],
    source_code_link2:
      "certifications/Microsoft Office Specialist 2016 Master.pdf",
  },
  {
    name: "MOS: Excel",
    description: `
    MOS Excel certification earners demonstrate advanced Excel skills, including managing multi-sheet workbooks and visualizing data with budgets, financial statements, charts...
  `,
    tags: [
      {
        name: "2019",
        link: "certifications/Excel Associate 2019.pdf",
        color: "green-text-gradient",
      },
      {
        name: "2016 expert ",
        link: "certifications/Microsoft Office Excel® 2016 Expert.pdf",
        color: "green-text-gradient",
      },
      {
        name: "2016",
        link: "certifications/Microsoft Office Excel® 2016.pdf",
        color: "green-text-gradient",
      },
      {
        name: "2013",
        link: "certifications/Microsoft Office Excel® 2013.pdf",
        color: "green-text-gradient",
      },
    ],
    images: [excel2019, excelexpert2016, excel2016, excel2013],
    source_code_link2: "certifications/Excel Associate 2019.pdf",
  },
  {
    name: "MOS: Word",
    description: `
    Microsoft Word Expert certification earners master advanced Word features, customizing settings for business plans, research papers, and mass mailings.
  
  `,
    tags: [
      {
        name: "2019",
        link: "certifications/Word and Word 2019.pdf",
        color: "blue-text-gradient",
      },
      {
        name: "2016 expert ",
        link: "certifications/Microsoft Office Word 2016 Expert.pdf",
        color: "blue-text-gradient",
      },
      {
        name: "2016",
        link: "certifications/Microsoft Office Word 2016.pdf",
        color: "blue-text-gradient",
      },
      {
        name: "2013",
        link: "certifications/Microsoft Office Word 2013.pdf",
        color: "blue-text-gradient",
      },
    ],
    images: [word2019, wordexpert2016, word2016, word2013],
    source_code_link2: "certifications/Word and Word 2019.pdf",
  },
  {
    name: "MOS: Access",
    description: `
    Microsoft Office Specialist: Access earners have an understanding of the basic database design principles and the correct application of the principal features of Access 2016. 
    Earners can create and maintain basic Access database objects including tables, relationships, data entry forms, multi-level reports, and multi-table queries.
  `,
    tags: [
      {
        name: "2016",
        link: "certifications/Microsoft Office Access 2016.pdf",
        color: "red-text-gradient",
      },
      {
        name: "2013 ",
        link: "certifications/Microsoft Office Access 2013.pdf",
        color: "red-text-gradient",
      },
    ],
    images: [access2016, access2013],
    source_code_link2: "certifications/Microsoft Office Access 2016.pdf",
  },
  {
    name: "MOS: Powerpoint",
    description: `
    Microsoft Office Specialist: PowerPoint earners demonstrate a fundamental understanding of the PowerPoint environment and correct application of PowerPoint slideshows. 
    Earners are able to create, edit, enhance and transform PowerPoint presentations, including professional grade sales presentations and  employee training.
  `,
    tags: [
      {
        name: "2016",
        link: "certifications/Microsoft Office PowerPoint® 2016.pdf",
        color: "orange-text-gradient",
      },
    ],
    images: [powerpoint2016],
    source_code_link2: "certifications/Microsoft Office PowerPoint® 2016.pdf",
  },
  {
    name: "MTA: Software Fundamentals",
    description: `
    MTA: Software Development Fundamentals certification earners demonstrate knowledge in core programming concepts, object-oriented programming, and general software development. 
    This certification validates foundational skills, showcasing their ability to grasp concepts across various environments.
  `,
    tags: [
      {
        name: "certification skills measured",
        link: "https://query.prod.cms.rt.microsoft.com/cms/api/am/binary/RWIdXK",
        color: "cyan-text-gradient",
      },
    ],
    images: mtasoftwarefundamentals,
    source_code_link2: "certifications/Software Development Fundamentals.pdf",
  },
  {
    name: "MTA: Database Administration Fundamentals",
    description: `
    
MTA: Database Administration certification earners showcase expertise in database concepts, creating database objects, and data manipulation. 
This certification validates skills essential for managing databases, demonstrating proficiency in essential tasks and concepts critical for database operations and maintenance.
  `,
    tags: [
      {
        name: "certification skills measured",
        link: "https://query.prod.cms.rt.microsoft.com/cms/api/am/binary/RE4tnJq",
        color: "cyan-text-gradient",
      },
    ],
    images: mtadatabaseadministration,
    source_code_link2:
      "certifications/Database Administration Fundamentals.pdf",
  },
  {
    name: "MTA: Security Fundamentals",
    description: `
    The MTA Security Fundamentals certification validates knowledge of security principles and practices. 
    It covers security layers, operating system security, network security, and security software. 
    Earners demonstrate understanding of key concepts, including encryption, authentication, malware protection, and firewall management, equipping them to address security challenges effectively in IT environments.
  `,
    tags: [
      {
        name: "certification skills measured",
        link: "https://query.prod.cms.rt.microsoft.com/cms/api/am/binary/RE4t7k1",
        color: "cyan-text-gradient",
      },
    ],
    images: mtasecurityfundamentals,
    source_code_link2: "certifications/Security Fundamentals.pdf",
  },
  {
    name: "MTA: Networking Fundamentals",
    description: `
    The MTA Networking Fundamentals certification validates networking knowledge for IT professionals. 
    It covers network infrastructures, hardware, protocols, and services. Candidates demonstrate expertise in LANs, WANs, wireless networking, IPv4/IPv6, DNS, and the OSI model. 
    This certification equips earners to manage, troubleshoot, and optimize networks in diverse IT environments effectively.
  `,
    tags: [
      {
        name: "certification skills measured",
        link: "https://query.prod.cms.rt.microsoft.com/cms/api/am/binary/RE4tnJr",
        color: "cyan-text-gradient",
      },
    ],
    images: mtanetworkingfundamentals,
    source_code_link2: "certifications/Networking Fundamentals.pdf",
  },
  {
    name: "MTA: Windows Operating System Fundamentals",
    description: `
    The MTA Windows Operating System Fundamentals certification validates foundational knowledge of Windows operating systems. 
    It covers configuring operating system settings, installing and upgrading client systems, managing applications, files, folders, devices, and understanding operating system maintenance. 
    Earners demonstrate the ability to manage and maintain Windows environments effectively, ensuring system reliability and performance.
  `,
    tags: [
      {
        name: "certification skills measured",
        link: "https://query.prod.cms.rt.microsoft.com/cms/api/am/binary/RE4tiy8",
        color: "cyan-text-gradient",
      },
    ],
    images: mtawindowsos,
    source_code_link2:
      "certifications/Windows® Operating System Fundamentals.pdf",
  },
  {
    name: "MTA: Windows Server Administration Fundamentals",
    description: `
    This MTA certifies foundational expertise in Windows Server management. 
    It covers server installation, roles, Active Directory, storage, performance management, and maintenance. 
    Earners demonstrate proficiency in areas like server virtualization, RAID configurations, performance monitoring, troubleshooting, and disaster recovery, showcasing their ability to ensure efficient and reliable server environments.
  `,
    tags: [
      {
        name: "certification skills measured",
        link: "https://query.prod.cms.rt.microsoft.com/cms/api/am/binary/RE4trjL",
        color: "cyan-text-gradient",
      },
    ],
    images: mtawindowsserver,
    source_code_link2:
      "certifications/Windows® Server Administration Fundamentals.pdf",
  },
  {
    name: "MTA: HTML5 Application Development Fundamentals",
    description: `
    The MTA HTML5 Application Development Fundamentals assesses skills in using HTML5, CSS3, and JavaScript for developing client applications, focusing on touch-enabled devices. 
    Key areas include building UIs with HTML5 tags, formatting interfaces with CSS, coding animations and UI updates with JavaScript. 
    It emphasizes hands-on experience with related technologies for state management, debugging, and testing.
  `,
    tags: [
      {
        name: "certification skills measured",
        link: "https://query.prod.cms.rt.microsoft.com/cms/api/am/binary/RE4tnJs",
        color: "cyan-text-gradient",
      },
    ],
    images: mtahtml5,
    source_code_link2:
      "certifications/HTML5 Application Development Fundamentals.pdf",
  },
  {
    name: "MTA: Introduction to Programming using HTML and CSS",
    description: `
    The MTA Introduction to Programming Using HTML and CSS evaluates proficiency in writing and debugging HTML and CSS. 
    Skills include using metadata, semantic elements, and navigation tags, structuring content and forms, presenting multimedia, and applying responsive layouts.
  `,
    tags: [
      {
        name: "certification skills measured",
        link: "https://query.prod.cms.rt.microsoft.com/cms/api/am/binary/RE4tkyQ",
        color: "cyan-text-gradient",
      },
    ],
    images: mtahtmlandcss,
    source_code_link2:
      "certifications/Introduction to Programming using HTML and CSS.pdf",
  },
  {
    name: "Fundamentals of digital marketing",
    description: `
    The Fundamentals of Digital Marketing by Google certification equips earners with essential digital marketing skills to grow their business or career. 
    Accredited by the Interactive Advertising Bureau, this course features 24 modules crafted by Google trainers.
     It includes practical exercises and real-world examples, enabling learners to apply knowledge effectively in digital marketing.
  `,
    tags: [],
    images: digitalmarketing,
    source_code_link2:
      "certifications/Google Fundamentals of digital marketing.pdf",
  },
];

export {
  services,
  articles,
  experiences,
  projects,
  certifications,
  education,
  proexp,
};
