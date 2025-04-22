/**
 * Tooltip content for cost calculator factors
 * Contains playful explanations and fun facts about building cost factors
 */

export const costTooltipContent = {
  buildingType: {
    residential: {
      title: "Residential Building Type",
      content: "Houses, apartments, and other living spaces. This affects base cost calculations since residential buildings have different structural requirements than other buildings.",
      funFact: "The average American home has doubled in size since the 1950s while family size has decreased!",
      impact: "medium" as const
    },
    commercial: {
      title: "Commercial Building Type",
      content: "Offices, retail spaces, and other business buildings. Commercial structures often require different materials and safety features than residential buildings.",
      funFact: "The Empire State Building was completed in just 410 days - ahead of schedule and under budget!",
      impact: "high" as const
    },
    industrial: {
      title: "Industrial Building Type",
      content: "Factories, warehouses, and production facilities. Industrial buildings need specialized infrastructure for heavy equipment and manufacturing processes.",
      funFact: "Boeing's factory in Everett, WA is the largest building in the world by volume (472 million cubic feet)!",
      impact: "high" as const
    },
    agricultural: {
      title: "Agricultural Building Type",
      content: "Barns, silos, and other farm structures. Agricultural buildings are typically more utilitarian with focus on durability rather than aesthetics.",
      funFact: "The largest free-standing barn in Washington state is in Whitman County, with over 42,500 square feet of space!",
      impact: "medium" as const
    }
  },
  
  region: {
    richland: {
      title: "Richland Region",
      content: "Located in the eastern part of Benton County, this region's construction costs are affected by local labor availability and material transportation distances.",
      funFact: "Richland was originally a small farm town before it boomed during the Manhattan Project in the 1940s!",
      impact: "medium" as const
    },
    kennewick: {
      title: "Kennewick Region",
      content: "In the central part of Benton County, Kennewick's construction market can vary based on urban density and access to suppliers.",
      funFact: "Kennewick Man, one of the oldest and most complete human skeletons found in North America (9,300 years old), was discovered here in 1996!",
      impact: "medium" as const
    },
    prosser: {
      title: "Prosser Region",
      content: "In the western part of Benton County, this region may have different cost considerations due to its more rural nature and distance from major supply centers.",
      funFact: "Prosser is known as the 'Birthplace of Washington Wine' with the first wine grapes planted in the 1940s!",
      impact: "medium" as const
    }
  },
  
  quality: {
    economy: {
      title: "Economy Quality",
      content: "Basic construction with minimal features and standard materials. Focuses on function over form.",
      funFact: "Even 'economy' quality homes today have features that would have been considered luxurious just 50 years ago!",
      impact: "low" as const
    },
    standard: {
      title: "Standard Quality",
      content: "Average construction quality with moderate features and materials. Balances cost and quality considerations.",
      funFact: "The 'standard' home today is approximately 2,400 square feet - more than double the size of a standard home in 1950!",
      impact: "medium" as const
    },
    custom: {
      title: "Custom Quality",
      content: "Above-average construction with attention to detail and improved materials. Offers better durability and aesthetics.",
      funFact: "Custom homes often incorporate 'hidden' premium features in walls, foundations, and systems that you never see but add significant value!",
      impact: "high" as const
    },
    luxury: {
      title: "Luxury Quality",
      content: "High-end construction with premium materials and extensive custom features. Emphasizes aesthetics and comfort.",
      funFact: "The most expensive home ever sold in Washington state went for $60 million and included a 275-foot private dock on Lake Washington!",
      impact: "high" as const
    }
  },
  
  complexityFactor: {
    title: "Building Complexity",
    content: "Measures how intricate the building design is. Complex buildings with unusual shapes, multiple levels, or custom features cost more to construct than simple, rectangular structures.",
    funFact: "Frank Lloyd Wright's Fallingwater house contains no 90-degree angles in its design, making it incredibly complex to build!",
    impact: "high" as const
  },
  
  conditionFactor: {
    title: "Building Condition",
    content: "Assesses the current state of an existing structure. Better conditions mean less remediation work is needed, while poor conditions increase costs for repairs and updates.",
    funFact: "The oldest continuously inhabited building in the U.S. is the Taos Pueblo in New Mexico, which has been occupied for over 1,000 years!",
    impact: "medium" as const
  },
  
  buildingAge: {
    title: "Building Age",
    content: "The age of a structure affects its value through depreciation. Newer buildings typically have higher values, while older ones depreciate based on various factors like building type and maintenance.",
    funFact: "Some historic buildings actually increase in value as they age due to their architectural significance and irreplaceable features!",
    impact: "medium" as const
  },
  
  squareFootage: {
    title: "Square Footage",
    content: "The total floor area of the building. A key factor in cost calculation as most building costs scale directly with size.",
    funFact: "The average cost per square foot in Benton County varies widely by neighborhood - sometimes by as much as 300%!",
    impact: "high" as const
  }
};

export default costTooltipContent;