export const projects = [
  {
    slug: "uno-no-mercy",
    title: "UNO No Mercy",
    desc: "Brutal UNO ruleset with elimination & chaos.",
    about: `
      UNO No Mercy is a multiplayer card game inspired by UNO,
      with aggressive rules, eliminations, and zero mercy.
      I learned about it from my two young nephews that excitedly mentioned how much more brutal and fun it was.
      They gave me inspiration and I made an online version of it for us to play together as they live hundreds of kilometers away.
      Now it's for everyone to enjoy with friends and loved ones across the world!

      
  `,
    features: [
      "Real-time multiplayer with Socket.IO",
      "No Mercy elimination rules",
      "Custom draw stacking logic",
      "Live lobby & rematch flow",
      "Live in-game chat between players in the same lobby",
    ],
    status: "live",
    category: "Games",
    tags: ["multiplayer", "socket.io"],
    playUrl: "https://unono.korki.dev",
  }
  ,



  {
    slug: "knucklebones",
    title: "Knucklebones",
    desc: "Dice game by Cult of the Lamb",
     about: `
      One of my beloved indie games Cult of the Lamb,
      had a minigame in it called Knucklebones that used dice in a creative way.
      I loved it at first sight even so that I made a basic physical version with paper and pen on a piece of paper
      for the board and carried around dice in a pouch to play. Decided it needs an online version to play with your friends anytime.
      
  `,

    features: [
      "Real-time multiplayer with Socket.IO",
      "Room/Lobby creation and invites for quick online play",
      "Realistic looking dice and roll animations",
      "Live lobby & rematch flow",
      "Live in-game chat between players in the same lobby",
    ],
    status: "live",
    category: "Games",
    tags: ["multiplayer", "socket.io"],
    playUrl: "https://knuckles.korki.dev"
  },

  
   {
    slug: "korko-rpg",
    title: "KORK ONLINE (KORKO)",
    desc: "Small text based RPG you can play solo or with friends",
    about: `
     This is an older project of mine back when I was hyped with game development and especially text-based games.
     It's an open world exploration survival adventure role playing game. So many ideas to put in here. Hopefully it is not hectic!


      
  `,
    features: [
      "Open procedural world to explore",
      "Gathering, Crafting and other skills",
      "Combat and realistic survival",
      "Multiplayer option",
      "NPCs",
    ],
    status: "wip",
    category: "Games",
    tags: ["multiplayer", "open world", "text-based"],
    playUrl: "https://korko.korki.dev",
  }
  ,
  {
    slug: "xmlforge",
    title: "XMLForge",
    desc: "Excel → XML invoice conversion tool with validation.",
    status: "prototype",
    category: "Tools",
    tags: ["python"],
    url: "https://github.com/yourname/xmlforge"
  },
  {
    slug: "faith-in-humanity",
    title: "Faith in Humanity Score",
    desc: "Vote on what you thing of humanity today",
     features: [
      "Global voting once per day",
      "Timer so the user knows how many hours until voting is avalaible again",
      "Charts and graphs of how the faith in humanity score has changed over time",
     
    ],
     about: `
     Tribute to faithinhumanityscore.com! A project I discovered back in the day and found the idea of it super interesting. The fact that random people contribute to a global score
     casting their vote and their opinion on how much they believe in humanity and even coming back the next day maybe with a change of heart excites me as a concept.
      
  `,
    status: "live",
    category: "Random",
    playUrl: "https://faith.korki.dev",
    tags: ["global"]
    
  },

   {
    slug: "drawmato",
    title: "Drawmato",
    desc: "Co-op draw with friends",
     features: [
      "Global voting once per day",
      "Timer so the user knows how many hours until voting is avalaible again",
      "Charts and graphs of how the faith in humanity score has changed over time",
     
    ],
     about: `
     Just a empty canvas to express your self with others while chatting
      
  `,
    status: "wip",
    category: "Random",
    playUrl: "korki.dev/drawmato",
    tags: ["draw", "socket.io"]
    
  },
];
