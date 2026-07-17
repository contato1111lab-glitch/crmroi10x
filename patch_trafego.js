import fs from 'fs';

let content = fs.readFileSync('src/pages/Trafego.tsx', 'utf8');

// Imports
content = content.replace(
  "import { Activity, Plus, Play, Pause, BarChart2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';",
  "import { Activity, Plus, Play, Pause, BarChart2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Layers, X, Check } from 'lucide-react';"
);
// Wait, I already added Server in the import earlier or maybe it was another file?
// Let's just find the exact import string.
