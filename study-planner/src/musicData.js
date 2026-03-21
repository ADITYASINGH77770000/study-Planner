// ─────────────────────────────────────────────
//  Music Suggestions by Mood
// ─────────────────────────────────────────────

export const MUSIC_BY_MOOD = {
  exhausted: {
    title: "Gentle Recharge 🌙",
    subtitle: "Soft music to ease your tired mind back in",
    color: "#6B7280",
    vibe: "Calm · Slow · Healing",
    playlists: [
      { name: "Lo-Fi Sleep & Study", platform: "Spotify", url: "https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4e취", icon: "🎵", genre: "Lo-Fi" },
      { name: "Peaceful Piano", platform: "Spotify", url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO", icon: "🎹", genre: "Classical" },
      { name: "Sleep & Relaxation", platform: "YouTube", url: "https://www.youtube.com/results?search_query=relaxing+sleep+music+for+studying", icon: "▶️", genre: "Ambient" },
    ],
    artists: ["Max Richter", "Ólafur Arnalds", "Brian Eno", "Nils Frahm"],
    tips: [
      "🎧 Keep volume low — under 50%",
      "🎵 Avoid lyrics when reading/writing",
      "⏸️ Take a real break before studying",
    ],
    searchQuery: "peaceful piano study music",
  },
  stressed: {
    title: "Stress Relief Sounds 🌿",
    subtitle: "Let the music untangle your thoughts",
    color: "#EF4444",
    vibe: "Calming · Grounding · Slow",
    playlists: [
      { name: "Nature Sounds + Rain", platform: "YouTube", url: "https://www.youtube.com/results?search_query=rain+sounds+study+focus", icon: "🌧️", genre: "Nature" },
      { name: "Deep Focus", platform: "Spotify", url: "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ", icon: "🎯", genre: "Ambient" },
      { name: "Anti-Anxiety Music", platform: "YouTube", url: "https://www.youtube.com/results?search_query=anti+anxiety+music+study", icon: "🧘", genre: "Healing" },
    ],
    artists: ["Weightless by Marconi Union", "Hans Zimmer", "Johann Johannsson", "Explosions in the Sky"],
    tips: [
      "🌿 Try 'Weightless' by Marconi Union — scientifically calming",
      "🎶 Nature sounds help reduce cortisol",
      "🧘 5 mins of music before studying helps",
    ],
    searchQuery: "stress relief study music calm",
  },
  meh: {
    title: "Focus Engine 🎧",
    subtitle: "Music to wake up your brain gently",
    color: "#F59E0B",
    vibe: "Steady · Focused · Neutral",
    playlists: [
      { name: "Lo-Fi Hip Hop Beats", platform: "YouTube", url: "https://www.youtube.com/results?search_query=lofi+hip+hop+study+beats", icon: "🎧", genre: "Lo-Fi" },
      { name: "Chill Study Vibes", platform: "Spotify", url: "https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS", icon: "☁️", genre: "Chill" },
      { name: "Coffee Shop Ambience", platform: "YouTube", url: "https://www.youtube.com/results?search_query=coffee+shop+ambience+study", icon: "☕", genre: "Ambient" },
    ],
    artists: ["Nujabes", "J Dilla", "Tomppabeats", "L'indécis"],
    tips: [
      "☕ Coffee shop sounds boost creativity",
      "🔁 Repetitive beats help enter flow state",
      "🎧 Lo-fi is perfect for reading & notes",
    ],
    searchQuery: "lofi hip hop chill study music",
  },
  good: {
    title: "Flow State Playlist 🌊",
    subtitle: "Music that keeps you locked in",
    color: "#10B981",
    vibe: "Focused · Smooth · Productive",
    playlists: [
      { name: "Instrumental Study Mix", platform: "YouTube", url: "https://www.youtube.com/results?search_query=instrumental+study+music+focus", icon: "🎼", genre: "Instrumental" },
      { name: "Brain Food", platform: "Spotify", url: "https://open.spotify.com/playlist/37i9dQZF1DWXLeA8Omikj7", icon: "🧠", genre: "Focus" },
      { name: "Jazz for Studying", platform: "YouTube", url: "https://www.youtube.com/results?search_query=jazz+music+for+studying", icon: "🎷", genre: "Jazz" },
    ],
    artists: ["GoGo Penguin", "Bonobo", "Tycho", "Khruangbin"],
    tips: [
      "🌊 Match music tempo to your reading speed",
      "🎵 Instrumental jazz boosts problem-solving",
      "⏱️ Use music as a Pomodoro timer",
    ],
    searchQuery: "focus flow state study music",
  },
  energized: {
    title: "Power Mode 🚀",
    subtitle: "High-energy music for deep work sessions",
    color: "#8B5CF6",
    vibe: "Energetic · Intense · Epic",
    playlists: [
      { name: "Epic Study Music", platform: "YouTube", url: "https://www.youtube.com/results?search_query=epic+study+music+concentration", icon: "⚡", genre: "Epic" },
      { name: "Electronic Focus", platform: "Spotify", url: "https://open.spotify.com/playlist/37i9dQZF1DX6GwdWRQMQpq", icon: "🔊", genre: "Electronic" },
      { name: "Hans Zimmer / Interstellar", platform: "YouTube", url: "https://www.youtube.com/results?search_query=hans+zimmer+study+music+epic", icon: "🎬", genre: "Cinematic" },
    ],
    artists: ["Hans Zimmer", "Two Steps from Hell", "Ramin Djawadi", "Audiomachine"],
    tips: [
      "🚀 High-BPM music = faster processing",
      "🎬 Cinematic scores boost motivation",
      "⚡ Save your hype playlist for tough problems",
    ],
    searchQuery: "epic cinematic study music energized",
  },
};

export const AFTER_STUDY_MUSIC = {
  exhausted: {
    title: "Post-Study Recovery 🛁",
    desc: "You worked hard. Time to truly unwind.",
    suggestions: [
      { name: "Sleep Sounds / Rain", url: "https://www.youtube.com/results?search_query=rain+sounds+sleep+relaxing", icon: "🌧️" },
      { name: "Spa & Meditation", url: "https://www.youtube.com/results?search_query=spa+meditation+music+relax", icon: "🧘" },
      { name: "ASMR Study Debrief", url: "https://www.youtube.com/results?search_query=asmr+relax+after+studying", icon: "🌙" },
    ],
  },
  stressed: {
    title: "Decompress Time 🌈",
    desc: "The hard part is done. Let it all go.",
    suggestions: [
      { name: "Feel Good Indie Pop", url: "https://www.youtube.com/results?search_query=feel+good+indie+pop+playlist", icon: "🌈" },
      { name: "Calm Acoustic", url: "https://www.youtube.com/results?search_query=acoustic+calm+relax+music", icon: "🎸" },
      { name: "Nature Walk Sounds", url: "https://www.youtube.com/results?search_query=nature+walk+sounds+birds", icon: "🌿" },
    ],
  },
  meh: {
    title: "Lift Your Mood 😊",
    desc: "Good job getting through it. Reward yourself!",
    suggestions: [
      { name: "Happy Vibes Playlist", url: "https://www.youtube.com/results?search_query=happy+vibes+playlist+2024", icon: "😊" },
      { name: "Upbeat Pop Mix", url: "https://www.youtube.com/results?search_query=upbeat+pop+feel+good+mix", icon: "🎉" },
      { name: "Dance & Chill", url: "https://www.youtube.com/results?search_query=dance+chill+music+playlist", icon: "💃" },
    ],
  },
  good: {
    title: "Keep the Good Vibes 🌟",
    desc: "You crushed it today. Celebrate!",
    suggestions: [
      { name: "Chill R&B Mix", url: "https://www.youtube.com/results?search_query=chill+rnb+playlist+2024", icon: "✨" },
      { name: "Evening Indie Chill", url: "https://www.youtube.com/results?search_query=indie+chill+evening+playlist", icon: "🌅" },
      { name: "Feel Good Funk", url: "https://www.youtube.com/results?search_query=feel+good+funk+soul+playlist", icon: "🎷" },
    ],
  },
  energized: {
    title: "Ride the High 🔥",
    desc: "Channel that energy into something fun!",
    suggestions: [
      { name: "Workout Mix", url: "https://www.youtube.com/results?search_query=workout+gym+music+playlist", icon: "🏋️" },
      { name: "Party Hits", url: "https://www.youtube.com/results?search_query=party+hits+playlist+2024", icon: "🎉" },
      { name: "Hip Hop Bangers", url: "https://www.youtube.com/results?search_query=hip+hop+bangers+playlist", icon: "🔥" },
    ],
  },
};
