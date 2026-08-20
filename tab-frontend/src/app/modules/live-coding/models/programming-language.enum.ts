export enum ProgrammingLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  JAVA = 'java',
  CSHARP = 'csharp',
  CPP = 'cpp',
  SQL = 'sql'
}

export const ProgrammingLanguageLabel: Record<ProgrammingLanguage, string> = {
  [ProgrammingLanguage.JAVASCRIPT]: 'JavaScript',
  [ProgrammingLanguage.TYPESCRIPT]: 'TypeScript',
  [ProgrammingLanguage.PYTHON]: 'Python',
  [ProgrammingLanguage.JAVA]: 'Java',
  [ProgrammingLanguage.CSHARP]: 'C#',
  [ProgrammingLanguage.CPP]: 'C++',
  [ProgrammingLanguage.SQL]: 'SQL'
};