export const AVATAR_MAP: Record<string, string> = {
    'edward wearing': 'avatar_edward_wearing_1772222877224.png',
    'georgina wearing': 'avatar_georgina_wearing_1772223035422.png',
    'luke daly': 'avatar_luke_daly_1772223102669.png',
    'daniel horne': 'avatar_daniel_horne_1772222954376.png',
    'darren daly': 'avatar_darren_daly_1772222979758.png',
    'chris daly': 'avatar_chris_daly_1772222942062.png',
    'stephen flood': 'avatar_stephen_flood_1772223088474.png',
    'dave blackburn': 'avatar_dave_blackburn_1787685845732.png',
    'liam duxbury': 'avatar_liam_duxbury_1772223048076.png',
    'nathen benson': 'avatar_nathen_benson_1772223077518.png',
    'dave taylor': 'avatar_dave_taylor_1772223007740.png',
};

export const getAvatarFilename = (name: string): string => {
    if (!name) return '/avatars/avatar_hoodie.png';
    const key = name.toLowerCase().trim();
    if (AVATAR_MAP[key]) return `/avatars/${AVATAR_MAP[key]}`;
    return '/avatars/avatar_hoodie.png';
};
