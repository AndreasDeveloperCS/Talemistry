import { Injectable, Logger } from '@nestjs/common';
import { spawn, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { SqlExecutionService } from './sql-execution-service.service';
import { SqlExecutionContext } from '../models/sql-execution-context';

interface LocalImageConfig {
  dockerfile: string;
  context: string;
}

const LOCAL_IMAGES: Record<string, LocalImageConfig> = {
  'livecoding-ts': {
    dockerfile: 'docker/Dockerfile.typescript',
    context: '.',
  },
  'livecoding-java': {
    dockerfile: 'docker/Dockerfile.java',
    context: '.',
  },
  'livecoding-cs': {
    dockerfile: 'docker/Dockerfile.csharp',
    context: '.',
  },
  'livecoding-cpp': {
    dockerfile: 'docker/Dockerfile.cpp',
    context: '.',
  },
};

@Injectable()
export class CodeExecutionService {
  private readonly logger = new Logger(CodeExecutionService.name);

  constructor(private sqlExecutionService: SqlExecutionService) {}

  private ensureImageExists(image: string): void {
    const config = LOCAL_IMAGES[image];
    if (!config) {
      return; 
    }

    const inspect = spawnSync('docker', ['image', 'inspect', image], { stdio: 'pipe' });
    if (inspect.status === 0) return; 

    const candidates = [
      path.resolve(process.cwd(), config.dockerfile),        
      path.resolve(process.cwd(), '..', 'Evridis', 'backend', config.dockerfile),
      path.resolve(__dirname, '..', '..', '..', '..', '..', config.dockerfile),   
    ];

    let dockerfilePath: string | null = null;
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        dockerfilePath = candidate;
        break;
      }
    }

    if (!dockerfilePath) {
      this.logger.error(
        `Image "${image}" not found and Dockerfile not available at any of: ${candidates.join(', ')}`,
      );
      throw new Error(
        `Docker image "${image}" is not available. Run: docker build -t ${image} -f ${config.dockerfile} . (from backend/)`,
      );
    }

    const contextDir = path.dirname(dockerfilePath);
    this.logger.log(`Building Docker image "${image}" from ${dockerfilePath}`);
    const build = spawnSync('docker', ['build', '-t', image, '-f', dockerfilePath, contextDir], {
      stdio: 'pipe',
      timeout: 120_000,
    });

    if (build.status !== 0) {
      const stderr = build.stderr?.toString() || '';
      this.logger.error(`Failed to build image "${image}": ${stderr}`);
      throw new Error(`Failed to build Docker image "${image}". ${stderr}`);
    }

    this.logger.log(`Image "${image}" built successfully`);
  }

  async executeViaDocker(roomId: string, code: string, language: string, onData: (data: string) => void, sqlContext?: SqlExecutionContext) {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const fileId = `${roomId}-${Date.now()}`;
    let fileName = '';
    let dockerImage = '';
    let runCommand: string[] = [];
    const filesToCleanup: string[] = [];

    switch (language) {
      case 'javascript':
        fileName = `code-${fileId}.js`;
        dockerImage = 'node:18-alpine';
        runCommand = ['node', fileName];
        break;
      case 'python':
        fileName = `code-${fileId}.py`;
        dockerImage = 'python:3.11-alpine';
        runCommand = ['python', fileName];
        break;
      case 'typescript':
        fileName = `code-${fileId}.ts`;
        const jsFile = fileName.replace('.ts', '.js');
        dockerImage = 'livecoding-ts';
        filesToCleanup.push(path.join(tempDir, jsFile));
        runCommand = [
          'sh',
          '-c',
          `ts-node --transpile-only --compiler-options '{"target":"ES2020","module":"commonjs","strict":true,"esModuleInterop":true,"moduleResolution":"node","types":["node"]}' ${fileName}`
        ];
        break;
      case 'csharp':
        const projectDir = `cs-${fileId}`;
        const fullPath = path.join(tempDir, projectDir);
        fs.mkdirSync(fullPath);
        dockerImage = 'mcr.microsoft.com/dotnet/sdk:7.0';
        runCommand = [
          'bash',
          '-c',
          `
          cd ${projectDir} &&
          dotnet new console --force
          `
        ];
        spawnSync('docker', [
          'run', '--rm',
          '-v', `${tempDir.replace(/\\/g, '/')}:/app`,
          '-w', '/app',
          dockerImage,
          ...runCommand
        ], { stdio: 'inherit' });
        const programPath = path.join(fullPath, 'Program.cs');
        fs.writeFileSync(programPath, code);
        runCommand = [
          'bash',
          '-c',
          `cd ${projectDir} && dotnet run`
        ];
        filesToCleanup.push(fullPath);
        break;
      case 'java':
        const safeId = fileId.replace(/[^a-zA-Z0-9]/g, '');
        const className = `Main${safeId}`;
        const javaFile = `${className}.java`;
        const fullPath1 = path.join(tempDir, javaFile);
        dockerImage = 'livecoding-java';
        const fixedCode = code.replace(
          /public\s+class\s+\w+/,
          `public class ${className}`
        );
        fs.writeFileSync(fullPath1, fixedCode);
        filesToCleanup.push(fullPath1, path.join(tempDir, `${className}.class`));
        runCommand = [
          'sh',
          '-c',
          `javac /app/${javaFile} && java -cp /app ${className}`
        ];
        break;
      case 'cpp':
        fileName = `code-${fileId}.cpp`;
        dockerImage = 'gcc:13';

        const outputFile = `a.out`;

        runCommand = [
          'sh',
          '-c',
          `g++ ${fileName} -o ${outputFile} && ./${outputFile}`
        ];

        filesToCleanup.push(path.join(tempDir, outputFile));
        break;
      case 'sql':
        return this.sqlExecutionService.executeSql(code, sqlContext, onData);
      default:
        throw new Error('Unsupported language');
    }

    if (language !== 'csharp' && language !== 'java') {
      const filePath = path.join(tempDir, fileName);
      fs.writeFileSync(filePath, code);
      filesToCleanup.push(filePath);
    }

    this.ensureImageExists(dockerImage);

    const dockerArgs = [
      'run', '--rm', '--memory=1g', '--cpus=1', '--pids-limit=200', '--network=none',
      '-v', `${tempDir.replace(/\\/g, '/')}:/app`,
      '-w', '/app',
      dockerImage,
      ...runCommand
    ];

    const dockerProcess = spawn('docker', dockerArgs);

    dockerProcess.stdout.on('data', (data) => onData(data.toString()));
    dockerProcess.stderr.on('data', (data) => onData(data.toString()));

    const timeouts = { javascript: 15000, python: 15000, typescript: 50000, csharp: 30000, java: 30000, cpp: 50000, };
    const timeout = setTimeout(() => { dockerProcess.kill('SIGKILL'); onData('\nExecution timed out'); }, timeouts[language] || 15000);

    dockerProcess.on('close', () => {
      clearTimeout(timeout);

      try {
        filesToCleanup.forEach((filePath) => { 
          if (fs.existsSync(filePath)) {
            const stat = fs.lstatSync(filePath);

            if (stat.isDirectory()) {
              fs.rmSync(filePath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(filePath);
            }
          }
        });

        const tempFiles = fs.readdirSync(tempDir);
        tempFiles.forEach((file) => {
          if (file.endsWith('.class')) {
            const full = path.join(tempDir, file);
            if (fs.existsSync(full)) {
              fs.unlinkSync(full);
            }
          }
        });

        const testFile = path.join(tempDir, 'test.txt');
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }

      } catch (err) {
        console.error('Cleanup error:', err);
      }
    });
  }
}