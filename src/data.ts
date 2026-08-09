export interface Profile {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  photoUrl: string;
  interests: string[];
  values?: string[];
  personalityTraits?: string[];
}

export const allProfiles: Profile[] = [
  {
    id: "p1",
    name: "Lena",
    age: 28,
    location: "Berlin",
    bio: "Architektin mit einem Faible für alte Gebäude und neuen Kaffee. Wochenenden meistens draußen oder in der Kletterhalle.",
    photoUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    interests: ["Klettern", "Architektur", "Kaffee"],
    values: ["Ehrlichkeit", "Abenteuer", "Loyalität"],
    personalityTraits: ["Extrovertiert", "Kreativ", "Optimistisch"]
  },
  {
    id: "p2",
    name: "Jonas",
    age: 31,
    location: "Berlin",
    bio: "Softwareentwickler, der versucht, weniger Zeit vor Bildschirmen zu verbringen. Lerne gerade kochen.",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    interests: ["Kochen", "Wandern", "Tech"],
    values: ["Wachstum", "Familie", "Ehrlichkeit"],
    personalityTraits: ["Introvertiert", "Analytisch", "Ruhig"]
  },
  {
    id: "p3",
    name: "Clara",
    age: 26,
    location: "München",
    bio: "Lehrerin. Ich liebe es, neue Dinge zu lernen, sei es Töpfern oder Spanisch. Lache laut und oft.",
    photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
    interests: ["Töpfern", "Sprachen", "Theater"],
    values: ["Empathie", "Kreativität", "Freiheit"],
    personalityTraits: ["Extrovertiert", "Warmherzig", "Spontan"]
  }
];
