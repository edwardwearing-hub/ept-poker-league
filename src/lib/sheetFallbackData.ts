import type { PlayerStats, GameHistorySession } from './data';

export const FALLBACK_TOTAL_POT = 140;

export const FALLBACK_PLAYERS: PlayerStats[] = [
    {
        "rank": 1,
        "name": "Luke Daly",
        "nickname": "The Duke",
        "avatarUrl": "/avatars/avatar_duke.png",
        "gamesPlayed": 9,
        "wins": 2,
        "points": 71,
        "rebuys": 3,
        "addOns": 9,
        "cashPaid": 210,
        "winnings": 290,
        "profit": 80,
        "bonusChips": 35500,
        "knockOuts": 12,
        "rivalPlayer": "Liam Duxbury (4x)",
        "rivalKoCount": 4,
        "bulliedPlayer": "Georgina Wearing (2x)",
        "bulliedKoCount": 2,
        "playerKnockoutMap": {
            "Edward Wearing": 1,
            "Georgina Wearing": 2,
            "Daniel Horne": 0,
            "Darren Daly": 0,
            "Chris Daly": 2,
            "Stephen Flood": 0,
            "Dave Blackburn": 1,
            "Liam Duxbury": 2,
            "Nathen Benson": 2,
            "Dave Taylor": 1
        },
        "knockedOutByMap": {
            "Edward Wearing": 1,
            "Georgina Wearing": 1,
            "Daniel Horne": 0,
            "Darren Daly": 0,
            "Chris Daly": 2,
            "Stephen Flood": 0,
            "Dave Blackburn": 1,
            "Liam Duxbury": 4,
            "Nathen Benson": 0,
            "Dave Taylor": 2
        },
        "winPercentage": 22.2,
        "avgKnockouts": 1,
        "avgFinishPosition": 3,
        "avgWinnings": 72.5,
        "avgPoints": 5,
        "bubbleFinishes": 0,
        "mostRebuysSingle": 1,
        "cashFlowHistory": [
            {
                "date": "26/1/2026",
                "profit": 30
            },
            {
                "date": "21/2/2026",
                "profit": -30
            },
            {
                "date": "21/3/2026",
                "profit": -20
            },
            {
                "date": "26/4/2026",
                "profit": -20
            },
            {
                "date": "30/5/2026",
                "profit": -30
            },
            {
                "date": "27/6/2026",
                "profit": -30
            },
            {
                "date": "22/8/2026",
                "profit": 20
            },
            {
                "date": "3/10/2026",
                "profit": 80
            },
            {
                "date": "24/10/2026",
                "profit": 80
            }
        ],
        "enemyQueue": [],
        "totalHistoricalKOs": 12,
        "totalTimesKnockedOut": 11,
        "uniquePlayersHijacked": [
            "Edward Wearing",
            "Georgina Wearing",
            "Chris Daly",
            "Dave Blackburn",
            "Liam Duxbury",
            "Nathen Benson",
            "Dave Taylor"
        ],
        "koToGameRatio": 1.33,
        "secretPin": "5553",
        "hackTokens": 0,
        "isHijacked": false,
        "hijackerQueue": [],
        "vpip": 28,
        "aggressionFactor": 2.3,
        "badges": [],
        "archNemesis": {
            "name": "Liam Duxbury (4x)",
            "knockouts": 4,
            "chipDifferential": 0,
            "headToHeadNotes": "+£0 net profit edge over Liam Duxbury (4x)"
        }
    },
    {
        "rank": 2,
        "name": "Liam Duxbury",
        "nickname": "The Shark",
        "avatarUrl": "/avatars/avatar_shark.png",
        "gamesPlayed": 9,
        "wins": 2,
        "points": 66,
        "rebuys": 1,
        "addOns": 9,
        "cashPaid": 190,
        "winnings": 210,
        "profit": 20,
        "bonusChips": 33000,
        "knockOuts": 18,
        "rivalPlayer": "Edward Wearing (2x)",
        "rivalKoCount": 2,
        "bulliedPlayer": "Luke Daly (4x)",
        "bulliedKoCount": 4,
        "playerKnockoutMap": {
            "Edward Wearing": 1,
            "Georgina Wearing": 2,
            "Luke Daly": 4,
            "Daniel Horne": 1,
            "Darren Daly": 1,
            "Chris Daly": 3,
            "Stephen Flood": 0,
            "Dave Blackburn": 1,
            "Nathen Benson": 1,
            "Dave Taylor": 1
        },
        "knockedOutByMap": {
            "Edward Wearing": 2,
            "Georgina Wearing": 0,
            "Luke Daly": 2,
            "Daniel Horne": 1,
            "Darren Daly": 0,
            "Chris Daly": 1,
            "Stephen Flood": 0,
            "Dave Blackburn": 2,
            "Nathen Benson": 0,
            "Dave Taylor": 0
        },
        "winPercentage": 22.2,
        "avgKnockouts": 1,
        "avgFinishPosition": 4,
        "avgWinnings": 70,
        "avgPoints": 4,
        "bubbleFinishes": 2,
        "mostRebuysSingle": 1,
        "cashFlowHistory": [
            {
                "date": "26/1/2026",
                "profit": 90
            },
            {
                "date": "21/2/2026",
                "profit": -20
            },
            {
                "date": "21/3/2026",
                "profit": -20
            },
            {
                "date": "26/4/2026",
                "profit": 10
            },
            {
                "date": "30/5/2026",
                "profit": 50
            },
            {
                "date": "20/6/2026",
                "profit": -20
            },
            {
                "date": "22/8/2026",
                "profit": -20
            },
            {
                "date": "3/10/2026",
                "profit": -20
            },
            {
                "date": "24/10/2026",
                "profit": -20
            }
        ],
        "enemyQueue": [
            "Edward Wearing"
        ],
        "totalHistoricalKOs": 18,
        "totalTimesKnockedOut": 8,
        "uniquePlayersHijacked": [
            "Edward Wearing",
            "Georgina Wearing",
            "Luke Daly",
            "Daniel Horne",
            "Darren Daly",
            "Chris Daly",
            "Dave Blackburn",
            "Nathen Benson",
            "Dave Taylor"
        ],
        "koToGameRatio": 2,
        "secretPin": "1007",
        "hackTokens": 3,
        "isHijacked": true,
        "hijackerQueue": [
            "Nathen Benson"
        ],
        "vpip": 28,
        "aggressionFactor": 3.4,
        "badges": [
            {
                "id": "table-boss",
                "label": "Table Boss",
                "icon": "👑",
                "description": "High Aggression Factor (3.4) — Relentless post-flop bet sizing and pressure",
                "color": "bg-amber-500/15 border-amber-500/40 text-amber-300"
            },
            {
                "id": "headhunter",
                "label": "Headhunter",
                "icon": "☠️",
                "description": "Leader in Knockouts (18 KOs) — The premier executioner of the league",
                "color": "bg-purple-500/15 border-purple-500/40 text-purple-300"
            }
        ],
        "archNemesis": {
            "name": "Edward Wearing (2x)",
            "knockouts": 4,
            "chipDifferential": 0,
            "headToHeadNotes": "+£0 net profit edge over Edward Wearing (2x)"
        }
    },
    {
        "rank": 3,
        "name": "Edward Wearing",
        "nickname": "The Bounty",
        "avatarUrl": "/avatars/avatar_bounty.png",
        "gamesPlayed": 9,
        "wins": 1,
        "points": 63,
        "rebuys": 0,
        "addOns": 9,
        "cashPaid": 180,
        "winnings": 180,
        "profit": 0,
        "bonusChips": 31500,
        "knockOuts": 9,
        "rivalPlayer": "Dave Blackburn (2x)",
        "rivalKoCount": 2,
        "bulliedPlayer": "Georgina Wearing (2x)",
        "bulliedKoCount": 2,
        "playerKnockoutMap": {
            "Georgina Wearing": 2,
            "Luke Daly": 1,
            "Daniel Horne": 1,
            "Darren Daly": 0,
            "Chris Daly": 1,
            "Stephen Flood": 0,
            "Dave Blackburn": 0,
            "Liam Duxbury": 2,
            "Nathen Benson": 1,
            "Dave Taylor": 1
        },
        "knockedOutByMap": {
            "Georgina Wearing": 0,
            "Luke Daly": 1,
            "Daniel Horne": 1,
            "Darren Daly": 0,
            "Chris Daly": 1,
            "Stephen Flood": 0,
            "Dave Blackburn": 2,
            "Liam Duxbury": 1,
            "Nathen Benson": 1,
            "Dave Taylor": 1
        },
        "winPercentage": 11.1,
        "avgKnockouts": 1,
        "avgFinishPosition": 3,
        "avgWinnings": 36,
        "avgPoints": 5,
        "bubbleFinishes": 2,
        "mostRebuysSingle": 0,
        "cashFlowHistory": [
            {
                "date": "24/1/2026",
                "profit": -20
            },
            {
                "date": "21/2/2026",
                "profit": -20
            },
            {
                "date": "21/3/2026",
                "profit": -20
            },
            {
                "date": "25/4/2026",
                "profit": 60
            },
            {
                "date": "30/5/2026",
                "profit": 0
            },
            {
                "date": "27/6/2026",
                "profit": 20
            },
            {
                "date": "22/8/2026",
                "profit": -20
            },
            {
                "date": "3/10/2026",
                "profit": 0
            },
            {
                "date": "24/10/2026",
                "profit": 0
            }
        ],
        "enemyQueue": [
            "Nathen Benson"
        ],
        "totalHistoricalKOs": 9,
        "totalTimesKnockedOut": 8,
        "uniquePlayersHijacked": [
            "Georgina Wearing",
            "Luke Daly",
            "Daniel Horne",
            "Chris Daly",
            "Liam Duxbury",
            "Nathen Benson",
            "Dave Taylor"
        ],
        "koToGameRatio": 1,
        "secretPin": "6912",
        "hackTokens": 2,
        "isHijacked": false,
        "hijackerQueue": [],
        "vpip": 22,
        "aggressionFactor": 1.8,
        "badges": [],
        "archNemesis": {
            "name": "Dave Blackburn (2x)",
            "knockouts": 4,
            "chipDifferential": 0,
            "headToHeadNotes": "+£0 net profit edge over Dave Blackburn (2x)"
        }
    },
    {
        "rank": 4,
        "name": "Georgina Wearing",
        "nickname": "The Queen",
        "avatarUrl": "/avatars/avatar_hoodie.png",
        "gamesPlayed": 9,
        "wins": 0,
        "points": 42,
        "rebuys": 0,
        "addOns": 9,
        "cashPaid": 180,
        "winnings": 110,
        "profit": -70,
        "bonusChips": 21000,
        "knockOuts": 3,
        "rivalPlayer": "Edward Wearing (2x)",
        "rivalKoCount": 2,
        "bulliedPlayer": "Chris Daly (2x)",
        "bulliedKoCount": 2,
        "playerKnockoutMap": {
            "Edward Wearing": 0,
            "Luke Daly": 0,
            "Daniel Horne": 0,
            "Darren Daly": 0,
            "Chris Daly": 2,
            "Stephen Flood": 0,
            "Dave Blackburn": 0,
            "Liam Duxbury": 1,
            "Nathen Benson": 0,
            "Dave Taylor": 0
        },
        "knockedOutByMap": {
            "Edward Wearing": 2,
            "Luke Daly": 2,
            "Daniel Horne": 1,
            "Darren Daly": 0,
            "Chris Daly": 1,
            "Stephen Flood": 0,
            "Dave Blackburn": 1,
            "Liam Duxbury": 2,
            "Nathen Benson": 0,
            "Dave Taylor": 0
        },
        "winPercentage": 0,
        "avgKnockouts": 1,
        "avgFinishPosition": 4,
        "avgWinnings": 27.5,
        "avgPoints": 3,
        "bubbleFinishes": 0,
        "mostRebuysSingle": 0,
        "cashFlowHistory": [
            {
                "date": "25/1/2026",
                "profit": 0
            },
            {
                "date": "21/2/2026",
                "profit": 20
            },
            {
                "date": "21/3/2026",
                "profit": 10
            },
            {
                "date": "25/4/2026",
                "profit": -20
            },
            {
                "date": "30/5/2026",
                "profit": -20
            },
            {
                "date": "27/6/2026",
                "profit": 0
            },
            {
                "date": "22/8/2026",
                "profit": -20
            },
            {
                "date": "3/10/2026",
                "profit": -20
            },
            {
                "date": "24/10/2026",
                "profit": -20
            }
        ],
        "enemyQueue": [
            "Edward Wearing"
        ],
        "totalHistoricalKOs": 3,
        "totalTimesKnockedOut": 9,
        "uniquePlayersHijacked": [
            "Luke Daly",
            "Chris Daly",
            "Nathen Benson"
        ],
        "koToGameRatio": 0.33,
        "secretPin": "1409",
        "hackTokens": 2,
        "isHijacked": false,
        "hijackerQueue": [],
        "vpip": 19,
        "aggressionFactor": 0.9,
        "badges": [],
        "archNemesis": {
            "name": "Edward Wearing (2x)",
            "knockouts": 4,
            "chipDifferential": 0,
            "headToHeadNotes": "+£0 net profit edge over Edward Wearing (2x)"
        }
    },
    {
        "rank": 5,
        "name": "Chris Daly",
        "nickname": "The Wildcard",
        "avatarUrl": "/avatars/avatar_hoodie.png",
        "gamesPlayed": 6,
        "wins": 1,
        "points": 37,
        "rebuys": 3,
        "addOns": 6,
        "cashPaid": 150,
        "winnings": 140,
        "profit": -10,
        "bonusChips": 18500,
        "knockOuts": 5,
        "rivalPlayer": "Luke Daly (2x)",
        "rivalKoCount": 2,
        "bulliedPlayer": "Liam Duxbury (3x)",
        "bulliedKoCount": 3,
        "playerKnockoutMap": {
            "Edward Wearing": 1,
            "Georgina Wearing": 2,
            "Luke Daly": 1,
            "Daniel Horne": 0,
            "Darren Daly": 0,
            "Stephen Flood": 0,
            "Dave Blackburn": 0,
            "Liam Duxbury": 3,
            "Nathen Benson": 0,
            "Dave Taylor": 0
        },
        "knockedOutByMap": {
            "Edward Wearing": 1,
            "Georgina Wearing": 1,
            "Luke Daly": 2,
            "Daniel Horne": 1,
            "Darren Daly": 0,
            "Stephen Flood": 0,
            "Dave Blackburn": 0,
            "Liam Duxbury": 2,
            "Nathen Benson": 0,
            "Dave Taylor": 0
        },
        "winPercentage": 16.7,
        "avgKnockouts": 1,
        "avgFinishPosition": 4,
        "avgWinnings": 70,
        "avgPoints": 3,
        "bubbleFinishes": 1,
        "mostRebuysSingle": 1,
        "cashFlowHistory": [
            {
                "date": "26/1/2026",
                "profit": -30
            },
            {
                "date": "21/2/2026",
                "profit": 80
            },
            {
                "date": "21/3/2026",
                "profit": -20
            },
            {
                "date": "26/4/2026",
                "profit": -20
            },
            {
                "date": "23/5/2026",
                "profit": 0
            },
            {
                "date": "29/6/2026",
                "profit": 0
            },
            {
                "date": "22/8/2026",
                "profit": -30
            },
            {
                "date": "3/10/2026",
                "profit": 10
            },
            {
                "date": "24/10/2026",
                "profit": 0
            }
        ],
        "enemyQueue": [],
        "totalHistoricalKOs": 5,
        "totalTimesKnockedOut": 7,
        "uniquePlayersHijacked": [
            "Edward Wearing",
            "Georgina Wearing",
            "Luke Daly",
            "Liam Duxbury"
        ],
        "koToGameRatio": 0.83,
        "secretPin": "9692",
        "hackTokens": 3,
        "isHijacked": false,
        "hijackerQueue": [],
        "vpip": 29,
        "aggressionFactor": 1.4,
        "badges": [],
        "archNemesis": {
            "name": "Luke Daly (2x)",
            "knockouts": 3,
            "chipDifferential": 0,
            "headToHeadNotes": "+£0 net profit edge over Luke Daly (2x)"
        }
    },
    {
        "rank": 6,
        "name": "Dave Blackburn",
        "nickname": "The Professor",
        "avatarUrl": "/avatars/avatar_dave_blackburn_1787685845732.png",
        "gamesPlayed": 5,
        "wins": 2,
        "points": 37,
        "rebuys": 4,
        "addOns": 5,
        "cashPaid": 140,
        "winnings": 190,
        "profit": 50,
        "bonusChips": 18500,
        "knockOuts": 10,
        "rivalPlayer": "Liam Duxbury (2x)",
        "rivalKoCount": 2,
        "bulliedPlayer": "Liam Duxbury (2x)",
        "bulliedKoCount": 2,
        "playerKnockoutMap": {
            "Edward Wearing": 2,
            "Georgina Wearing": 1,
            "Luke Daly": 1,
            "Daniel Horne": 0,
            "Darren Daly": 0,
            "Chris Daly": 1,
            "Stephen Flood": 0,
            "Liam Duxbury": 2,
            "Nathen Benson": 1,
            "Dave Taylor": 2
        },
        "knockedOutByMap": {
            "Edward Wearing": 0,
            "Georgina Wearing": 0,
            "Luke Daly": 1,
            "Daniel Horne": 0,
            "Darren Daly": 0,
            "Chris Daly": 0,
            "Stephen Flood": 0,
            "Liam Duxbury": 2,
            "Nathen Benson": 2,
            "Dave Taylor": 1
        },
        "winPercentage": 40,
        "avgKnockouts": 1,
        "avgFinishPosition": 5,
        "avgWinnings": 95,
        "avgPoints": 2,
        "bubbleFinishes": 0,
        "mostRebuysSingle": 2,
        "cashFlowHistory": [
            {
                "date": "26/1/2026",
                "profit": 0
            },
            {
                "date": "21/2/2026",
                "profit": 0
            },
            {
                "date": "21/3/2026",
                "profit": 0
            },
            {
                "date": "26/4/2026",
                "profit": 0
            },
            {
                "date": "23/5/2026",
                "profit": -30
            },
            {
                "date": "20/6/2026",
                "profit": 50
            },
            {
                "date": "22/8/2026",
                "profit": 80
            },
            {
                "date": "3/10/2026",
                "profit": -30
            },
            {
                "date": "24/10/2026",
                "profit": -20
            }
        ],
        "enemyQueue": [
            "Nathen Benson"
        ],
        "totalHistoricalKOs": 10,
        "totalTimesKnockedOut": 6,
        "uniquePlayersHijacked": [
            "Edward Wearing",
            "Georgina Wearing",
            "Luke Daly",
            "Liam Duxbury",
            "Nathen Benson",
            "Dave Taylor"
        ],
        "koToGameRatio": 2,
        "secretPin": "1320",
        "hackTokens": 3,
        "isHijacked": false,
        "hijackerQueue": [],
        "vpip": 38,
        "aggressionFactor": 3,
        "badges": [
            {
                "id": "action-junkie",
                "label": "Action Junkie",
                "icon": "🔥",
                "description": "High VPIP (38%) — Drives high-action pots and loose pre-flop play",
                "color": "bg-orange-500/15 border-orange-500/40 text-orange-400"
            }
        ],
        "archNemesis": {
            "name": "Liam Duxbury (2x)",
            "knockouts": 2,
            "chipDifferential": 0,
            "headToHeadNotes": "+£0 net profit edge over Liam Duxbury (2x)"
        }
    },
    {
        "rank": 7,
        "name": "Nathen Benson",
        "nickname": "Big Stack",
        "avatarUrl": "/avatars/avatar_hoodie.png",
        "gamesPlayed": 6,
        "wins": 0,
        "points": 34,
        "rebuys": 1,
        "addOns": 6,
        "cashPaid": 130,
        "winnings": 80,
        "profit": -50,
        "bonusChips": 17000,
        "knockOuts": 5,
        "rivalPlayer": "Edward Wearing (1x)",
        "rivalKoCount": 1,
        "bulliedPlayer": "Dave Taylor (2x)",
        "bulliedKoCount": 2,
        "playerKnockoutMap": {
            "Edward Wearing": 1,
            "Georgina Wearing": 0,
            "Luke Daly": 0,
            "Daniel Horne": 0,
            "Darren Daly": 0,
            "Chris Daly": 0,
            "Stephen Flood": 0,
            "Dave Blackburn": 0,
            "Liam Duxbury": 0,
            "Dave Taylor": 2
        },
        "knockedOutByMap": {
            "Edward Wearing": 1,
            "Georgina Wearing": 1,
            "Luke Daly": 1,
            "Daniel Horne": 1,
            "Darren Daly": 0,
            "Chris Daly": 0,
            "Stephen Flood": 0,
            "Dave Blackburn": 1,
            "Liam Duxbury": 1,
            "Dave Taylor": 0
        },
        "winPercentage": 0,
        "avgKnockouts": 1.5,
        "avgFinishPosition": 4,
        "avgWinnings": 80,
        "avgPoints": 2,
        "bubbleFinishes": 3,
        "mostRebuysSingle": 1,
        "cashFlowHistory": [
            {
                "date": "26/1/2026",
                "profit": -20
            },
            {
                "date": "21/2/2026",
                "profit": 0
            },
            {
                "date": "21/3/2026",
                "profit": -20
            },
            {
                "date": "26/4/2026",
                "profit": 0
            },
            {
                "date": "30/5/2026",
                "profit": -20
            },
            {
                "date": "22/6/2026",
                "profit": -20
            },
            {
                "date": "22/8/2026",
                "profit": 0
            },
            {
                "date": "3/10/2026",
                "profit": -20
            },
            {
                "date": "24/10/2026",
                "profit": 50
            }
        ],
        "enemyQueue": [
            "Edward Wearing"
        ],
        "totalHistoricalKOs": 5,
        "totalTimesKnockedOut": 6,
        "uniquePlayersHijacked": [
            "Edward Wearing",
            "Dave Blackburn",
            "Dave Taylor"
        ],
        "koToGameRatio": 0.83,
        "secretPin": "2506",
        "hackTokens": 0,
        "isHijacked": false,
        "hijackerQueue": [],
        "vpip": 24,
        "aggressionFactor": 1.2,
        "badges": [],
        "archNemesis": {
            "name": "Edward Wearing (1x)",
            "knockouts": 3,
            "chipDifferential": 0,
            "headToHeadNotes": "+£0 net profit edge over Edward Wearing (1x)"
        }
    },
    {
        "rank": 8,
        "name": "Daniel Horne",
        "nickname": "The Joker",
        "avatarUrl": "/avatars/avatar_hoodie.png",
        "gamesPlayed": 3,
        "wins": 1,
        "points": 22,
        "rebuys": 0,
        "addOns": 2,
        "cashPaid": 50,
        "winnings": 90,
        "profit": 40,
        "bonusChips": 11000,
        "knockOuts": 5,
        "rivalPlayer": "Edward Wearing (1x)",
        "rivalKoCount": 1,
        "bulliedPlayer": "Edward Wearing (1x)",
        "bulliedKoCount": 1,
        "playerKnockoutMap": {
            "Edward Wearing": 1,
            "Georgina Wearing": 1,
            "Luke Daly": 0,
            "Darren Daly": 0,
            "Chris Daly": 1,
            "Stephen Flood": 0,
            "Dave Blackburn": 0,
            "Liam Duxbury": 1,
            "Nathen Benson": 1,
            "Dave Taylor": 0
        },
        "knockedOutByMap": {
            "Edward Wearing": 1,
            "Georgina Wearing": 0,
            "Luke Daly": 0,
            "Darren Daly": 0,
            "Chris Daly": 0,
            "Stephen Flood": 0,
            "Dave Blackburn": 0,
            "Liam Duxbury": 1,
            "Nathen Benson": 0,
            "Dave Taylor": 0
        },
        "winPercentage": 33.3,
        "avgKnockouts": 1,
        "avgFinishPosition": 5,
        "avgWinnings": 90,
        "avgPoints": 1,
        "bubbleFinishes": 0,
        "mostRebuysSingle": 0,
        "cashFlowHistory": [
            {
                "date": "26/1/2026",
                "profit": -20
            },
            {
                "date": "21/2/2026",
                "profit": -20
            },
            {
                "date": "21/3/2026",
                "profit": 80
            },
            {
                "date": "26/4/2026",
                "profit": 0
            },
            {
                "date": "23/5/2026",
                "profit": 0
            },
            {
                "date": "27/6/2026",
                "profit": 0
            },
            {
                "date": "22/8/2026",
                "profit": 0
            },
            {
                "date": "26/9/2026",
                "profit": 0
            },
            {
                "date": "24/10/2026",
                "profit": 0
            }
        ],
        "enemyQueue": [],
        "totalHistoricalKOs": 5,
        "totalTimesKnockedOut": 2,
        "uniquePlayersHijacked": [
            "Edward Wearing",
            "Georgina Wearing",
            "Chris Daly",
            "Liam Duxbury",
            "Nathen Benson"
        ],
        "koToGameRatio": 1.67,
        "secretPin": "0000",
        "hackTokens": 3,
        "isHijacked": false,
        "hijackerQueue": [],
        "vpip": 25,
        "aggressionFactor": 3.3,
        "badges": [
            {
                "id": "table-boss",
                "label": "Table Boss",
                "icon": "👑",
                "description": "High Aggression Factor (3.3) — Relentless post-flop bet sizing and pressure",
                "color": "bg-amber-500/15 border-amber-500/40 text-amber-300"
            }
        ],
        "archNemesis": {
            "name": "Edward Wearing (1x)",
            "knockouts": 1,
            "chipDifferential": 0,
            "headToHeadNotes": "+£0 net profit edge over Edward Wearing (1x)"
        }
    },
    {
        "rank": 9,
        "name": "Dave Taylor",
        "nickname": "The Ace",
        "avatarUrl": "/avatars/avatar_hoodie.png",
        "gamesPlayed": 7,
        "wins": 0,
        "points": 22,
        "rebuys": 1,
        "addOns": 7,
        "cashPaid": 150,
        "winnings": 60,
        "profit": -90,
        "bonusChips": 11000,
        "knockOuts": 4,
        "rivalPlayer": "Dave Blackburn (3x)",
        "rivalKoCount": 3,
        "bulliedPlayer": "Liam Duxbury (2x)",
        "bulliedKoCount": 2,
        "playerKnockoutMap": {
            "Edward Wearing": 1,
            "Georgina Wearing": 0,
            "Luke Daly": 0,
            "Daniel Horne": 0,
            "Darren Daly": 0,
            "Chris Daly": 0,
            "Stephen Flood": 0,
            "Dave Blackburn": 1,
            "Liam Duxbury": 2,
            "Nathen Benson": 0
        },
        "knockedOutByMap": {
            "Edward Wearing": 1,
            "Georgina Wearing": 0,
            "Luke Daly": 1,
            "Daniel Horne": 0,
            "Darren Daly": 0,
            "Chris Daly": 0,
            "Stephen Flood": 0,
            "Dave Blackburn": 3,
            "Liam Duxbury": 1,
            "Nathen Benson": 1
        },
        "winPercentage": 0,
        "avgKnockouts": 1.333333333,
        "avgFinishPosition": 6,
        "avgWinnings": 60,
        "avgPoints": 1,
        "bubbleFinishes": 0,
        "mostRebuysSingle": 1,
        "cashFlowHistory": [
            {
                "date": "26/1/2026",
                "profit": -20
            },
            {
                "date": "21/2/2026",
                "profit": -20
            },
            {
                "date": "21/3/2026",
                "profit": 0
            },
            {
                "date": "26/4/2026",
                "profit": 0
            },
            {
                "date": "30/5/2026",
                "profit": 30
            },
            {
                "date": "20/6/2026",
                "profit": -20
            },
            {
                "date": "22/8/2026",
                "profit": -20
            },
            {
                "date": "3/10/2026",
                "profit": -20
            },
            {
                "date": "24/10/2026",
                "profit": -30
            }
        ],
        "enemyQueue": [
            "Nathen Benson"
        ],
        "totalHistoricalKOs": 4,
        "totalTimesKnockedOut": 7,
        "uniquePlayersHijacked": [
            "Edward Wearing",
            "Luke Daly",
            "Dave Blackburn"
        ],
        "koToGameRatio": 0.57,
        "secretPin": "0000",
        "hackTokens": 3,
        "isHijacked": false,
        "hijackerQueue": [],
        "vpip": 22,
        "aggressionFactor": 0.9,
        "badges": [],
        "archNemesis": {
            "name": "Dave Blackburn (3x)",
            "knockouts": 3,
            "chipDifferential": 0,
            "headToHeadNotes": "+£0 net profit edge over Dave Blackburn (3x)"
        }
    },
    {
        "rank": 10,
        "name": "Darren Daly",
        "nickname": "Double D",
        "avatarUrl": "/avatars/avatar_hoodie.png",
        "gamesPlayed": 1,
        "wins": 0,
        "points": 4,
        "rebuys": 0,
        "addOns": 1,
        "cashPaid": 20,
        "winnings": 0,
        "profit": -20,
        "bonusChips": 2000,
        "knockOuts": 0,
        "rivalPlayer": "Liam Duxbury (1x)",
        "rivalKoCount": 1,
        "bulliedPlayer": "None (0x)",
        "bulliedKoCount": 0,
        "playerKnockoutMap": {
            "Edward Wearing": 0,
            "Georgina Wearing": 0,
            "Luke Daly": 0,
            "Daniel Horne": 0,
            "Chris Daly": 0,
            "Stephen Flood": 0,
            "Dave Blackburn": 0,
            "Liam Duxbury": 0,
            "Nathen Benson": 0,
            "Dave Taylor": 0
        },
        "knockedOutByMap": {
            "Edward Wearing": 0,
            "Georgina Wearing": 0,
            "Luke Daly": 0,
            "Daniel Horne": 0,
            "Chris Daly": 0,
            "Stephen Flood": 0,
            "Dave Blackburn": 0,
            "Liam Duxbury": 1,
            "Nathen Benson": 0,
            "Dave Taylor": 0
        },
        "winPercentage": 0,
        "avgKnockouts": 0,
        "avgFinishPosition": 5,
        "avgWinnings": 0,
        "avgPoints": 0,
        "bubbleFinishes": 0,
        "mostRebuysSingle": 0,
        "cashFlowHistory": [
            {
                "date": "26/1/2026",
                "profit": -20
            },
            {
                "date": "21/2/2026",
                "profit": 0
            },
            {
                "date": "21/3/2026",
                "profit": 0
            },
            {
                "date": "26/4/2026",
                "profit": 0
            },
            {
                "date": "23/5/2026",
                "profit": 0
            },
            {
                "date": "28/6/2026",
                "profit": 0
            },
            {
                "date": "22/8/2026",
                "profit": 0
            },
            {
                "date": "26/9/2026",
                "profit": 0
            },
            {
                "date": "24/10/2026",
                "profit": 0
            }
        ],
        "enemyQueue": [],
        "totalHistoricalKOs": 0,
        "totalTimesKnockedOut": 1,
        "uniquePlayersHijacked": [],
        "koToGameRatio": 0,
        "secretPin": "0000",
        "hackTokens": 3,
        "isHijacked": false,
        "hijackerQueue": [],
        "vpip": 18,
        "aggressionFactor": 0.9,
        "badges": [],
        "archNemesis": {
            "name": "Liam Duxbury (1x)",
            "knockouts": 1,
            "chipDifferential": 0,
            "headToHeadNotes": "+£0 net profit edge over Liam Duxbury (1x)"
        }
    },
    {
        "rank": 11,
        "name": "Stephen Flood",
        "nickname": "The Flash",
        "avatarUrl": "/avatars/avatar_hoodie.png",
        "gamesPlayed": 0,
        "wins": 0,
        "points": 0,
        "rebuys": 0,
        "addOns": 0,
        "cashPaid": 0,
        "winnings": 0,
        "profit": 0,
        "bonusChips": 0,
        "knockOuts": 0,
        "rivalPlayer": "None (0x)",
        "rivalKoCount": 0,
        "bulliedPlayer": "None (0x)",
        "bulliedKoCount": 0,
        "playerKnockoutMap": {
            "Edward Wearing": 0,
            "Georgina Wearing": 0,
            "Luke Daly": 0,
            "Daniel Horne": 0,
            "Darren Daly": 0,
            "Chris Daly": 0,
            "Dave Blackburn": 0,
            "Liam Duxbury": 0,
            "Nathen Benson": 0,
            "Dave Taylor": 0
        },
        "knockedOutByMap": {
            "Edward Wearing": 0,
            "Georgina Wearing": 0,
            "Luke Daly": 0,
            "Daniel Horne": 0,
            "Darren Daly": 0,
            "Chris Daly": 0,
            "Dave Blackburn": 0,
            "Liam Duxbury": 0,
            "Nathen Benson": 0,
            "Dave Taylor": 0
        },
        "winPercentage": 0,
        "avgKnockouts": 0,
        "avgFinishPosition": 0,
        "avgWinnings": 0,
        "avgPoints": 0,
        "bubbleFinishes": 0,
        "mostRebuysSingle": 0,
        "cashFlowHistory": [
            {
                "date": "26/1/2026",
                "profit": 0
            },
            {
                "date": "21/2/2026",
                "profit": 0
            },
            {
                "date": "21/3/2026",
                "profit": 0
            },
            {
                "date": "26/4/2026",
                "profit": 0
            },
            {
                "date": "23/5/2026",
                "profit": 0
            },
            {
                "date": "30/6/2026",
                "profit": 0
            },
            {
                "date": "22/8/2026",
                "profit": 0
            },
            {
                "date": "26/9/2026",
                "profit": 0
            },
            {
                "date": "24/10/2026",
                "profit": 0
            }
        ],
        "enemyQueue": [],
        "totalHistoricalKOs": 0,
        "totalTimesKnockedOut": 0,
        "uniquePlayersHijacked": [],
        "koToGameRatio": 0,
        "secretPin": "0001",
        "hackTokens": 3,
        "isHijacked": false,
        "hijackerQueue": [],
        "vpip": 18,
        "aggressionFactor": 0.9,
        "badges": [],
        "archNemesis": {
            "name": "None (0x)",
            "knockouts": 1,
            "chipDifferential": 0,
            "headToHeadNotes": "+£0 net profit edge over None (0x)"
        }
    }
];

export const FALLBACK_GAME_HISTORY: GameHistorySession[] = [
    {
        "date": "Saturday, January 24, 2026",
        "prizePot": 180,
        "sidePot": 20,
        "results": [
            {
                "name": "Edward Wearing",
                "place": "4",
                "winnings": 0,
                "points": 6,
                "kos": 1
            },
            {
                "name": "Georgina Wearing",
                "place": "3",
                "winnings": 20,
                "points": 7,
                "kos": 1
            },
            {
                "name": "Luke Daly",
                "place": "2",
                "winnings": 50,
                "points": 11,
                "kos": 3
            },
            {
                "name": "Daniel Horne",
                "place": "9",
                "winnings": 0,
                "points": 1,
                "kos": 0
            },
            {
                "name": "Darren Daly",
                "place": "5",
                "winnings": 0,
                "points": 4,
                "kos": 0
            },
            {
                "name": "Chris Daly",
                "place": "6",
                "winnings": 0,
                "points": 3,
                "kos": 2
            },
            {
                "name": "Liam Duxbury",
                "place": "1",
                "winnings": 110,
                "points": 17,
                "kos": 5
            },
            {
                "name": "Nathen Benson",
                "place": "8",
                "winnings": 0,
                "points": 1,
                "kos": 0
            },
            {
                "name": "Dave Taylor",
                "place": "7",
                "winnings": 0,
                "points": 1,
                "kos": 0
            }
        ]
    },
    {
        "date": "Saturday, February 21, 2026",
        "prizePot": 150,
        "sidePot": 10,
        "results": [
            {
                "name": "Edward Wearing",
                "place": "3",
                "winnings": 0,
                "points": 7,
                "kos": 1
            },
            {
                "name": "Georgina Wearing",
                "place": "2",
                "winnings": 40,
                "points": 8,
                "kos": 0
            },
            {
                "name": "Luke Daly",
                "place": "4",
                "winnings": 0,
                "points": 7,
                "kos": 2
            },
            {
                "name": "Daniel Horne",
                "place": "5",
                "winnings": 0,
                "points": 4,
                "kos": 0
            },
            {
                "name": "Chris Daly",
                "place": "1",
                "winnings": 100,
                "points": 15,
                "kos": 3
            },
            {
                "name": "Liam Duxbury",
                "place": "7",
                "winnings": 0,
                "points": 2,
                "kos": 1
            },
            {
                "name": "Dave Taylor",
                "place": "6",
                "winnings": 0,
                "points": 1,
                "kos": 0
            }
        ]
    },
    {
        "date": "Saturday, March 21, 2026",
        "prizePot": 130,
        "sidePot": 10,
        "results": [
            {
                "name": "Edward Wearing",
                "place": "5",
                "winnings": 0,
                "points": 4,
                "kos": 0
            },
            {
                "name": "Georgina Wearing",
                "place": "2",
                "winnings": 30,
                "points": 8,
                "kos": 0
            },
            {
                "name": "Luke Daly",
                "place": "7",
                "winnings": 0,
                "points": 1,
                "kos": 0
            },
            {
                "name": "Daniel Horne",
                "place": "1",
                "winnings": 90,
                "points": 17,
                "kos": 5
            },
            {
                "name": "Chris Daly",
                "place": "6",
                "winnings": 0,
                "points": 1,
                "kos": 0
            },
            {
                "name": "Liam Duxbury",
                "place": "3",
                "winnings": 0,
                "points": 7,
                "kos": 1
            },
            {
                "name": "Nathen Benson",
                "place": "4",
                "winnings": 0,
                "points": 5,
                "kos": 0
            }
        ]
    },
    {
        "date": "Saturday, May 02, 2026",
        "prizePot": 120,
        "sidePot": 10,
        "results": [
            {
                "name": "Edward Wearing",
                "place": "1",
                "winnings": 80,
                "points": 14,
                "kos": 2
            },
            {
                "name": "Georgina Wearing",
                "place": "5",
                "winnings": 0,
                "points": 4,
                "kos": 0
            },
            {
                "name": "Luke Daly",
                "place": "4",
                "winnings": 0,
                "points": 6,
                "kos": 1
            },
            {
                "name": "Chris Daly",
                "place": "3",
                "winnings": 0,
                "points": 7,
                "kos": 1
            },
            {
                "name": "Liam Duxbury",
                "place": "2",
                "winnings": 30,
                "points": 10,
                "kos": 2
            }
        ]
    },
    {
        "date": "Saturday, May 30, 2026",
        "prizePot": 170,
        "sidePot": 20,
        "results": [
            {
                "name": "Edward Wearing",
                "place": "3",
                "winnings": 20,
                "points": 6,
                "kos": 0
            },
            {
                "name": "Georgina Wearing",
                "place": "6",
                "winnings": 0,
                "points": 1,
                "kos": 0
            },
            {
                "name": "Luke Daly",
                "place": "5",
                "winnings": 0,
                "points": 4,
                "kos": 0
            },
            {
                "name": "Dave Blackburn",
                "place": "7",
                "winnings": 0,
                "points": 1,
                "kos": 0
            },
            {
                "name": "Liam Duxbury",
                "place": "1",
                "winnings": 70,
                "points": 15,
                "kos": 3
            },
            {
                "name": "Nathen Benson",
                "place": "4",
                "winnings": 0,
                "points": 5,
                "kos": 0
            },
            {
                "name": "Dave Taylor",
                "place": "2",
                "winnings": 60,
                "points": 11,
                "kos": 3
            }
        ]
    },
    {
        "date": "Saturday, June 27, 2026",
        "prizePot": 170,
        "sidePot": 20,
        "results": [
            {
                "name": "Edward Wearing",
                "place": "2",
                "winnings": 40,
                "points": 9,
                "kos": 1
            },
            {
                "name": "Georgina Wearing",
                "place": "3",
                "winnings": 20,
                "points": 7,
                "kos": 1
            },
            {
                "name": "Luke Daly",
                "place": "5",
                "winnings": 0,
                "points": 5,
                "kos": 1
            },
            {
                "name": "Dave Blackburn",
                "place": "1",
                "winnings": 90,
                "points": 16,
                "kos": 4
            },
            {
                "name": "Liam Duxbury",
                "place": "7",
                "winnings": 0,
                "points": 2,
                "kos": 1
            },
            {
                "name": "Nathen Benson",
                "place": "4",
                "winnings": 0,
                "points": 5,
                "kos": 0
            },
            {
                "name": "Dave Taylor",
                "place": "6",
                "winnings": 0,
                "points": 1,
                "kos": 0
            }
        ]
    },
    {
        "date": "Saturday, August 22, 2026",
        "prizePot": 150,
        "sidePot": 10,
        "results": [
            {
                "name": "Edward Wearing",
                "place": "7",
                "winnings": 0,
                "points": 1,
                "kos": 0
            },
            {
                "name": "Georgina Wearing",
                "place": "6",
                "winnings": 0,
                "points": 2,
                "kos": 1
            },
            {
                "name": "Luke Daly",
                "place": "2",
                "winnings": 40,
                "points": 8,
                "kos": 0
            },
            {
                "name": "Chris Daly",
                "place": "5",
                "winnings": 0,
                "points": 4,
                "kos": 0
            },
            {
                "name": "Dave Blackburn",
                "place": "1",
                "winnings": 100,
                "points": 16,
                "kos": 4
            },
            {
                "name": "Liam Duxbury",
                "place": "3",
                "winnings": 0,
                "points": 8,
                "kos": 2
            },
            {
                "name": "Dave Taylor",
                "place": "4",
                "winnings": 0,
                "points": 5,
                "kos": 0
            }
        ]
    },
    {
        "date": "Saturday, October 03, 2026",
        "prizePot": 180,
        "sidePot": 20,
        "results": [
            {
                "name": "Edward Wearing",
                "place": "3",
                "winnings": 20,
                "points": 7,
                "kos": 1
            },
            {
                "name": "Georgina Wearing",
                "place": "5",
                "winnings": 0,
                "points": 4,
                "kos": 0
            },
            {
                "name": "Luke Daly",
                "place": "1",
                "winnings": 100,
                "points": 16,
                "kos": 4
            },
            {
                "name": "Chris Daly",
                "place": "2",
                "winnings": 40,
                "points": 9,
                "kos": 1
            },
            {
                "name": "Dave Blackburn",
                "place": "7",
                "winnings": 0,
                "points": 3,
                "kos": 2
            },
            {
                "name": "Liam Duxbury",
                "place": "6",
                "winnings": 0,
                "points": 1,
                "kos": 0
            },
            {
                "name": "Nathen Benson",
                "place": "4",
                "winnings": 0,
                "points": 5,
                "kos": 0
            },
            {
                "name": "Dave Taylor",
                "place": "8",
                "winnings": 0,
                "points": 2,
                "kos": 1
            }
        ]
    },
    {
        "date": "Saturday, October 24, 2026",
        "prizePot": 220,
        "sidePot": 20,
        "results": [
            {
                "name": "Edward Wearing",
                "place": "3",
                "winnings": 20,
                "points": 9,
                "kos": 3
            },
            {
                "name": "Georgina Wearing",
                "place": "6",
                "winnings": 0,
                "points": 1,
                "kos": 0
            },
            {
                "name": "Luke Daly",
                "place": "1",
                "winnings": 100,
                "points": 12,
                "kos": 0
            },
            {
                "name": "Dave Blackburn",
                "place": "9",
                "winnings": 0,
                "points": 1,
                "kos": 0
            },
            {
                "name": "Liam Duxbury",
                "place": "8",
                "winnings": 0,
                "points": 1,
                "kos": 0
            },
            {
                "name": "Nathen Benson",
                "place": "2",
                "winnings": 80,
                "points": 11,
                "kos": 3
            },
            {
                "name": "Dave Taylor",
                "place": "7",
                "winnings": 0,
                "points": 1,
                "kos": 0
            }
        ]
    }
];
