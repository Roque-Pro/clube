// Banco de dados COMPLETO de marcas de veículos brasileiros
export const BRAZILIAN_VEHICLES = {
  // NACIONAIS (fabricados no Brasil)
  NATIONAL: {
    fiat: {
      brand: "Fiat",
      models: [
        "Uno",
        "Palio",
        "Siena",
        "Strada",
        "Toro",
        "Pulse",
        "Cronos",
        "Argo",
        "Mobi",
        "Tempra",
        "Tipo",
        "Brava",
        "Ducato",
        "Fiorino",
      ],
      isNational: true,
    },
    volkswagen: {
      brand: "Volkswagen",
      models: [
        "Gol",
        "Polo",
        "Fox",
        "Saveiro",
        "Amarok",
        "Virtus",
        "T-Cross",
        "Voyage",
        "Jetta",
        "Golf",
        "Kombi",
        "Up",
        "Fusca",
      ],
      isNational: true,
    },
    chevrolet: {
      brand: "Chevrolet",
      models: [
        "Onix",
        "Spin",
        "Tracker",
        "Prisma",
        "Celta",
        "Agile",
        "Vectra",
        "Astra",
        "Blazer",
        "S10",
      ],
      isNational: true,
    },
    hyundai: {
      brand: "Hyundai",
      models: [
        "HB20",
        "HB20S",
        "Creta",
        "i30",
        "Tucson",
        "Elantra",
        "Veloster",
        "Santa Fe",
      ],
      isNational: true,
    },
    toyota: {
      brand: "Toyota",
      models: [
        "Etios",
        "Yaris",
        "Hilux",
        "SW4",
      ],
      isNational: true,
    },
    renault: {
      brand: "Renault",
      models: [
        "Kwid",
        "Sandero",
        "Logan",
        "Duster",
        "Clio",
        "Megane",
      ],
      isNational: true,
    },
    peugeot: {
      brand: "Peugeot",
      models: [
        "208",
        "307",
        "3008",
        "2008",
        "5008",
        "406",
        "206",
        "207",
      ],
      isNational: true,
    },
    citroen: {
      brand: "Citroën",
      models: [
        "C3",
        "C4",
        "Berlingo",
        "Jumpy",
        "AirCross",
        "C-Elysée",
        "Picasso",
      ],
      isNational: true,
    },
    chery: {
      brand: "Chery",
      models: [
        "QQ",
        "Tiggo",
        "Arrizo",
        "QQ3",
        "Tiggo 2",
        "Tiggo 3",
        "Tiggo 5",
        "Tiggo 7",
      ],
      isNational: true,
    },
    jac: {
      brand: "JAC",
      models: [
        "J2",
        "J3",
        "J4",
        "J5",
        "J6",
        "J7",
        "T5",
        "T6",
      ],
      isNational: true,
    },
    caoa: {
      brand: "Caoa Chery",
      models: [
        "Arrizo 5",
        "Tiggo 2",
        "Tiggo 3",
        "Tiggo 5",
      ],
      isNational: true,
    },
  },

  // IMPORTADOS
  IMPORTED: {
    honda: {
      brand: "Honda",
      models: [
        "Civic",
        "Accord",
        "Fit",
        "HR-V",
        "CR-V",
        "Pilot",
        "City",
        "Jazz",
        "Odyssey",
        "Prelude",
        "Integra",
      ],
      isNational: false,
    },
    nissan: {
      brand: "Nissan",
      models: [
        "Versa",
        "March",
        "Frontier",
        "Kicks",
        "X-Trail",
        "Sentra",
        "Altima",
        "Pathfinder",
        "Murano",
        "Tiida",
      ],
      isNational: false,
    },
    toyota_importado: {
      brand: "Toyota",
      models: [
        "Corolla",
        "Camry",
        "Fortuner",
        "RAV4",
        "Prius",
        "Land Cruiser",
        "Tacoma",
      ],
      isNational: false,
    },
    mitsubishi: {
      brand: "Mitsubishi",
      models: [
        "ASX",
        "Outlander",
        "Pajero",
        "Lancer",
        "L200",
        "Triton",
        "Eclipse",
        "Galant",
      ],
      isNational: false,
    },
    suzuki: {
      brand: "Suzuki",
      models: [
        "Swift",
        "Vitara",
        "Jimny",
        "S-Cross",
        "Ignis",
        "SX4",
        "Grand Vitara",
      ],
      isNational: false,
    },
    kia: {
      brand: "Kia",
      models: [
        "Cerato",
        "Optima",
        "Sorento",
        "Sportage",
        "Stonic",
        "Picanto",
        "Rio",
        "Niro",
      ],
      isNational: false,
    },
    bmw: {
      brand: "BMW",
      models: [
        "320i",
        "330i",
        "340i",
        "X1",
        "X3",
        "X5",
        "X6",
        "X7",
        "M340i",
        "M440i",
        "428i",
        "M3",
        "M5",
      ],
      isNational: false,
    },
    mercedes: {
      brand: "Mercedes-Benz",
      models: [
        "A-Class",
        "B-Class",
        "C-Class",
        "E-Class",
        "S-Class",
        "GLA",
        "GLC",
        "GLE",
        "GLS",
        "AMG C63",
        "AMG E63",
        "Classe A",
        "Classe E",
      ],
      isNational: false,
    },
    audi: {
      brand: "Audi",
      models: [
        "A1",
        "A3",
        "A4",
        "A5",
        "A6",
        "A7",
        "A8",
        "Q3",
        "Q4",
        "Q5",
        "Q7",
        "Q8",
        "RS3",
        "RS5",
      ],
      isNational: false,
    },
    porsche: {
      brand: "Porsche",
      models: [
        "911",
        "Cayenne",
        "Panamera",
        "Macan",
        "Boxster",
        "Cayman",
        "Taycan",
      ],
      isNational: false,
    },
    lamborghini: {
      brand: "Lamborghini",
      models: [
        "Gallardo",
        "Huracan",
        "Aventador",
        "Urus",
        "Revuelto",
      ],
      isNational: false,
    },
    ferrari: {
      brand: "Ferrari",
      models: [
        "F8",
        "SF90",
        "Roma",
        "Portofino",
        "California",
        "458",
        "F430",
      ],
      isNational: false,
    },
    lexus: {
      brand: "Lexus",
      models: [
        "ES",
        "IS",
        "GS",
        "LS",
        "RX",
        "NX",
        "LX",
        "UX",
      ],
      isNational: false,
    },
    infiniti: {
      brand: "Infiniti",
      models: [
        "Q50",
        "Q60",
        "Q70",
        "QX50",
        "QX60",
        "QX80",
        "FX",
      ],
      isNational: false,
    },
    jeep: {
      brand: "Jeep",
      models: [
        "Renegade",
        "Compass",
        "Wrangler",
        "Gladiator",
        "Cherokee",
        "Grand Cherokee",
      ],
      isNational: false,
    },
    ram: {
      brand: "Ram",
      models: [
        "1500",
        "2500",
        "3500",
        "Rebel",
        "Power Wagon",
      ],
      isNational: false,
    },
    subaru: {
      brand: "Subaru",
      models: [
        "Impreza",
        "Legacy",
        "Outback",
        "Crosstrek",
        "Forester",
        "WRX",
        "BRZ",
      ],
      isNational: false,
    },
    mazda: {
      brand: "Mazda",
      models: [
        "CX-3",
        "CX-5",
        "CX-9",
        "3",
        "6",
        "MX-5",
        "CX-30",
      ],
      isNational: false,
    },
    volvo: {
      brand: "Volvo",
      models: [
        "S60",
        "S90",
        "V90",
        "XC40",
        "XC60",
        "XC90",
        "V60",
      ],
      isNational: false,
    },
    jaguar: {
      brand: "Jaguar",
      models: [
        "XE",
        "XF",
        "XJ",
        "F-PACE",
        "F-TYPE",
        "E-PACE",
      ],
      isNational: false,
    },
    rollsroyce: {
      brand: "Rolls-Royce",
      models: [
        "Ghost",
        "Wraith",
        "Dawn",
        "Phantom",
      ],
      isNational: false,
    },
    bentley: {
      brand: "Bentley",
      models: [
        "Continental",
        "Flying Spur",
        "Bentayga",
      ],
      isNational: false,
    },
    maserati: {
      brand: "Maserati",
      models: [
        "Ghibli",
        "Quattroporte",
        "Levante",
        "MC20",
      ],
      isNational: false,
    },
    alfa: {
      brand: "Alfa Romeo",
      models: [
        "Giulia",
        "Stelvio",
        "4C",
        "Giulietta",
      ],
      isNational: false,
    },
    fiat_importado: {
      brand: "Fiat",
      models: [
        "500",
        "500X",
        "Panda",
      ],
      isNational: false,
    },
    lancia: {
      brand: "Lancia",
      models: [
        "Lybra",
        "Thesis",
      ],
      isNational: false,
    },
    seat: {
      brand: "SEAT",
      models: [
        "Ibiza",
        "Leon",
        "Arona",
        "Tarraco",
      ],
      isNational: false,
    },
    skoda: {
      brand: "Škoda",
      models: [
        "Fabia",
        "Octavia",
        "Superb",
        "Kodiaq",
      ],
      isNational: false,
    },
    hyundai_importado: {
      brand: "Hyundai",
      models: [
        "Genesis",
        "Ioniq",
      ],
      isNational: false,
    },
    kia_importado: {
      brand: "Kia",
      models: [
        "Telluride",
        "EV9",
      ],
      isNational: false,
    },
    genesis: {
      brand: "Genesis",
      models: [
        "G70",
        "G80",
        "GV70",
      ],
      isNational: false,
    },
    polestar: {
      brand: "Polestar",
      models: [
        "1",
        "2",
        "3",
      ],
      isNational: false,
    },
    lucid: {
      brand: "Lucid",
      models: [
        "Air",
        "Gravity",
      ],
      isNational: false,
    },
    tesla: {
      brand: "Tesla",
      models: [
        "Model S",
        "Model 3",
        "Model X",
        "Model Y",
        "Roadster",
        "Cybertruck",
      ],
      isNational: false,
    },
    rivian: {
      brand: "Rivian",
      models: [
        "R1T",
        "R1S",
      ],
      isNational: false,
    },
    byd: {
      brand: "BYD",
      models: [
        "Song",
        "Qin",
        "Yuan",
        "Tang",
        "Atto 3",
      ],
      isNational: false,
    },
    haval: {
      brand: "Haval",
      models: [
        "H6",
        "H9",
        "H2",
      ],
      isNational: false,
    },
    geely: {
      brand: "Geely",
      models: [
        "Emgrand",
        "GS",
        "Coolray",
      ],
      isNational: false,
    },
    great_wall: {
      brand: "Great Wall",
      models: [
        "Wey",
        "Ora",
        "Tank",
      ],
      isNational: false,
    },
    ora: {
      brand: "ORA",
      models: [
        "Good Cat",
        "Black Cat",
      ],
      isNational: false,
    },
  },
};

export interface VehicleValidationResult {
  isNational: boolean;
  brand: string;
  model: string;
  year: string;
  confidence: number;
  message: string;
}

// Algoritmo de Levenshtein Distance para fuzzy matching
const levenshteinDistance = (a: string, b: string): number => {
  const aLen = a.length;
  const bLen = b.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= bLen; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= aLen; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i][j - 1] + 1, // insert
        matrix[i - 1][j] + 1, // delete
        matrix[i - 1][j - 1] + cost // replace
      );
    }
  }

  return matrix[bLen][aLen];
};

// Remove acentos e caracteres especiais
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s]/g, ""); // Remove caracteres especiais
};

// Encontra match fuzzy com tolerância a erros
const findFuzzyMatch = (
  input: string,
  models: string[],
  maxDistance: number = 2
): string | null => {
  const normalizedInput = normalizeString(input);

  let bestMatch: string | null = null;
  let bestDistance = maxDistance;

  for (const model of models) {
    const normalizedModel = normalizeString(model);
    const distance = levenshteinDistance(normalizedInput, normalizedModel);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = model;
    }

    // Match exato (ignorando case e acentos)
    if (distance === 0) {
      return model;
    }
  }

  return bestMatch;
};

export const validateVehicleOffline = (
  input: string
): VehicleValidationResult => {
  const cleanInput = normalizeString(input);
  const yearMatch = input.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : "desconhecido";

  // ESTRATÉGIA 1: Procura por modelo em marcas NACIONAIS
  for (const [key, data] of Object.entries(BRAZILIAN_VEHICLES.NATIONAL)) {
    const foundModel = findFuzzyMatch(input, data.models, 2);
    const normalizedBrand = normalizeString(data.brand);

    // Se encontrou o modelo OU a marca está no input
    if (foundModel || cleanInput.includes(normalizedBrand)) {
      return {
        isNational: true,
        brand: data.brand,
        model: foundModel || "Desconhecido",
        year,
        confidence: foundModel ? 0.95 : 0.85,
        message: `${data.brand} ${foundModel || ""} é um veículo nacional, elegível para o Clube do Vidro.`,
      };
    }
  }

  // ESTRATÉGIA 2: Procura por modelo em marcas IMPORTADAS
  for (const [key, data] of Object.entries(BRAZILIAN_VEHICLES.IMPORTED)) {
    const foundModel = findFuzzyMatch(input, data.models, 2);
    const normalizedBrand = normalizeString(data.brand);

    // Se encontrou o modelo OU a marca está no input
    if (foundModel || cleanInput.includes(normalizedBrand)) {
      return {
        isNational: false,
        brand: data.brand,
        model: foundModel || "Desconhecido",
        year,
        confidence: foundModel ? 0.95 : 0.85,
        message: `${data.brand} ${foundModel || ""} é um veículo importado e não está elegível para o Clube do Vidro.`,
      };
    }
  }

  // ESTRATÉGIA 3: Se digitar APENAS o modelo (sem marca), procura em todas
  for (const [key, data] of Object.entries(BRAZILIAN_VEHICLES.NATIONAL)) {
    for (const model of data.models) {
      const normalizedModel = normalizeString(model);
      const distance = levenshteinDistance(cleanInput, normalizedModel);
      
      if (distance <= 1) { // Tolerância maior para modelo isolado
        return {
          isNational: true,
          brand: data.brand,
          model,
          year,
          confidence: 0.9,
          message: `${data.brand} ${model} é um veículo nacional, elegível para o Clube do Vidro.`,
        };
      }
    }
  }

  for (const [key, data] of Object.entries(BRAZILIAN_VEHICLES.IMPORTED)) {
    for (const model of data.models) {
      const normalizedModel = normalizeString(model);
      const distance = levenshteinDistance(cleanInput, normalizedModel);
      
      if (distance <= 1) { // Tolerância maior para modelo isolado
        return {
          isNational: false,
          brand: data.brand,
          model,
          year,
          confidence: 0.9,
          message: `${data.brand} ${model} é um veículo importado e não está elegível para o Clube do Vidro.`,
        };
      }
    }
  }

  // Se não encontrou nada, assume importado (mais seguro)
  return {
    isNational: false,
    brand: "Desconhecido",
    model: input,
    year,
    confidence: 0.2,
    message:
      "Não conseguimos identificar o veículo. Por segurança, marcamos como não elegível. Tente novamente com o nome completo.",
  };
};
