export const moods = [
  { 
    name: "Heart-Pumping", 
    emoji: "🔥", 
    params: { with_genres: "28,12", "vote_average.gte": 7 } // Action & Adventure, high rated
  },
  { 
    name: "Pure Terror", 
    emoji: "😱", 
    params: { with_genres: "27", "with_keywords": "9748|10245" } // Horror with "slasher" or "supernatural" keywords
  },
  { 
    name: "Deep Sob", 
    emoji: "😭", 
    params: { with_genres: "18", "with_keywords": "9672" } // Drama with "tearjerker" keyword
  },
  { 
    name: "Brain Melter", 
    emoji: "🤯", 
    params: { with_genres: "878,9648", "with_keywords": "310" } // Sci-Fi & Mystery with "mindfuck" keyword
  },
  { 
    name: "Feel Good", 
    emoji: "☀️", 
    params: { with_genres: "35,10751", "without_genres": "18,27" } // Comedy & Family, but NO drama or horror
  }
];
