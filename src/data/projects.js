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
      for the board and carried around dice in a pouch to play with friends.
      
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
    slug: "xmlforge",
    title: "XMLForge",
    desc: "Excel → XML invoice conversion tool with validation.",
    status: "prototype",
    category: "Tools",
    tags: ["python"],
    url: "https://github.com/yourname/xmlforge"
  },
  {
    slug: "coming-soon",
    title: "Coming soon",
    desc: "More experiments incoming.",
    status: "wip",
    category: "Etc",
    tags: ["lab"]
    // no url → goes to /p/coming-soon
  },
];
