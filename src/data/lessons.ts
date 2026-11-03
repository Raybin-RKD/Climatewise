import type { Lesson } from '@/types/lesson';

export const LESSONS: Lesson[] = [
  {
    id: 'what-is-climate-change',
    number: 1,
    title: 'What is Climate Change?',
    minutes: 8,
    category: 'Basics',
    summary: 'The difference between weather and climate, and why long-term change matters.',
    content: [
      'Weather is what happens outside today: rain, sun, wind or heat. Climate is the pattern of weather in one place over many years, usually measured over 30 years or more.',
      'Climate change means a long-term shift in those patterns. Today it mostly means the warming of the Earth that has been measured since the late 1800s.',
      'A single cold day does not disprove climate change, just as a single hot day does not prove it. Scientists look at long-term trends across the whole planet.',
    ],
  },
  {
    id: 'greenhouse-gases',
    number: 2,
    title: 'Greenhouse Gases',
    minutes: 7,
    category: 'Causes',
    summary: 'How gases such as carbon dioxide trap heat around the planet.',
    content: [
      'Some gases in the air, such as carbon dioxide (CO2), methane and water vapour, act like a blanket. They let sunlight in, but slow down the heat escaping back to space.',
      'This natural effect keeps the Earth warm enough for life. The problem is that human activity has added extra greenhouse gases, so the blanket is getting thicker.',
      'Carbon dioxide stays in the atmosphere for a very long time, which is why reducing emissions early matters so much.',
    ],
  },
  {
    id: 'human-activities',
    number: 3,
    title: 'Human Activities',
    minutes: 6,
    category: 'Causes',
    summary: 'The everyday activities that release greenhouse gases.',
    content: [
      'Burning coal, oil and gas for electricity, heating and transport is the largest source of the extra carbon dioxide in the air.',
      'Cutting down forests also adds to the problem, because trees store carbon and remove it from the air while they grow.',
      'Farming, waste and industry release gases such as methane and nitrous oxide. Many of these activities are tied to the way we produce food, goods and energy.',
    ],
  },
  {
    id: 'global-impacts',
    number: 4,
    title: 'Global Impacts',
    minutes: 8,
    category: 'Effects',
    summary: 'How a warming planet affects people, places and nature.',
    content: [
      'A warmer planet brings more extreme heat, heavier rainfall in some places and longer droughts in others. Sea levels are also rising as ice melts and ocean water expands.',
      'These changes affect food and water supplies, health, homes and wildlife. Low-lying islands and countries with fewer resources to adapt can be hit hardest.',
      'Climate impacts are not spread evenly, and people who have contributed least to the problem are often the most exposed to it.',
    ],
  },
  {
    id: 'solutions-and-hope',
    number: 5,
    title: 'Solutions & Hope',
    minutes: 6,
    category: 'Effects',
    summary: 'What governments, communities and individuals can do.',
    content: [
      'Clean energy such as solar and wind, better public transport, energy-efficient buildings and protecting forests all reduce emissions.',
      'Individual choices also add up: using less energy, wasting less food, choosing walking, cycling or public transport, and talking about the issue with others.',
      'The faster emissions fall, the more future damage can be avoided. Every action counts, and every fraction of a degree matters.',
    ],
  },
];