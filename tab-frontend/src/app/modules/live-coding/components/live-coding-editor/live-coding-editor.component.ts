import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { catchError, debounceTime, Observable, of, Subject, Subscription, take, takeUntil, tap } from 'rxjs';
import { LiveCodingSocketService } from '../../services/live-coding-socket.service';
import * as monacoTypes from 'monaco-editor';
import { AuthService } from 'src/app/modules/authentication/services/auth.service';
import { environment } from 'src/environments/environment';
import { languageTemplates } from '../../models/code-snippets';
import { ActivatedRoute } from '@angular/router';
import { ROLES } from 'src/app/modules/authentication/models/roles';
import { ClipboardEventType, FocusEventType, languageKeywordsMap } from '../../models/live-coding.model';
import { CodeSnippet } from '../../models/code-snippet.model';
import { DEFAULT_SNIPPETS } from '../../models/default-code-snippets-list.const';
import { CodeSnippetService } from '../../services/code-snippets.service';
import { Filtering, FilterRule, Sorting } from 'src/app/modules/general/services/search-logic.service';
import { getPropertyName } from 'src/shared-functions/shared-functions';
import { BaseEntity, OwnerEntity } from 'src/app/modules/general/models/base-entity';
import { ProgrammingLanguage } from '../../models/programming-language.enum';
import { SqlColumnType, SqlExecutionContext, SqlTable } from '../../models/sql-execution-context';

declare const monaco: typeof monacoTypes;

type SnippetTab = 'default' | 'personal' | 'ai';

export interface ClipboardNotification {
  id: number;
  message: string;
  type?: 'info' | 'warning' | 'danger';
}

@Component({
  selector: 'app-live-coding-editor',
  templateUrl: './live-coding-editor.component.html',
  styleUrl: './live-coding-editor.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LiveCodingEditorComponent implements OnInit, OnDestroy {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;

  editor!: monacoTypes.editor.IStandaloneCodeEditor;
  selectedLanguage: ProgrammingLanguage | string = ProgrammingLanguage.JAVASCRIPT;
  roomId = 'test-room-123';
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  isRemoteUpdate = false;
  output: string = '';
  userName: string = 'Unknown';
  remoteCursorDecorations: string[] = [];
  remoteCursors: { [userId: string]: string[] } = {};
  isRunning = false;
  mode: 'interview' | 'personal' = 'interview';
  notifications: ClipboardNotification[] = [];
  private notificationId = 0;
  private focusEventBuffer: { type: string; timestamp: number }[] = [];
  private focusTimeout: any;
  activeTab: SnippetTab = 'default';
  defaultSnippets: CodeSnippet[] = [];
  personalSnippets: CodeSnippet[] = [];
  aiPrompt = '';
  aiGeneratedSnippet: CodeSnippet | null = null;
  isGenerating = false;
  aiError = '';
  isPersonalSnippetsLoading: boolean = false;
  sorting: Sorting = {
    property: getPropertyName<BaseEntity>(e => e.createdDate),
    direction: 'DESC'
  };
  pageSize: number = 10;
  pageIndex: number = 0;
  newSnippet: CodeSnippet = this.getEmptySnippet();
  isTalentRole = false;
  aiSelectedLanguage = this.selectedLanguage;
  sqlContext!: SqlExecutionContext;
  isSqlExecuted: boolean = false;
  sqlResult: any[] = [];
  sqlError = '';
  sqlPassed?: boolean;
  sqlSuccess?: boolean;
  queryType?: string;
  rowCount?: number;
  executionTime?: number;

  private codeChange$ = new Subject<string>();
  private languageChange$ = new Subject<string>();
  private subCodeUpdate!: Subscription;
  private subCodeOutput!: Subscription;
  private subRemoteCursorMove!: Subscription;
  private subLanguageUpdate!: Subscription;
  protected _onDestroy = new Subject<void>();

  languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'cpp', label: 'C++' },
    { value: 'sql', label: 'SQL' }
  ];

  constructor(
    private socketService: LiveCodingSocketService,
    private codeSnippetsService: CodeSnippetService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.resolveRoom();
    this.loadDefaultSnippets();
    const template = languageTemplates[this.selectedLanguage];
    if (template && this.editor) {
      this.editor.setValue(template);
    }

    const user = this.resolveUser();
    this.userName = user.name;
    this.userId = this.authService.decodeJWTToken(user.idToken)?.user?._id;
    this.isTalentRole = this.isTalent();

    this.initSocket(user.idToken, user.name, user.email);

    this.initSocketListeners();
    if (this.mode === 'interview' && this.isTalent()) {
      this.openInterviewNotice();
    }

    if (this.isInterviewTalent()) {
      document.addEventListener('paste', this.handlePaste, true);
    }
  }

  ngAfterViewInit() {
    const onGotAmdLoader = () => {
      (window as any).require.config({
        paths: { vs: 'assets/monaco/vs' }
      });

      (window as any).require(['vs/editor/editor.main'], () => {
        this.initEditor();
      });
    };

    if (!(window as any).require) {
      if (!document.getElementById('monaco-loader')) {
        const loaderScript = document.createElement('script');
        loaderScript.id = 'monaco-loader';
        loaderScript.src = 'assets/monaco/vs/loader.js';
        loaderScript.onload = onGotAmdLoader;
        document.body.appendChild(loaderScript);
      }
    } else {
      onGotAmdLoader();
    }
  }

  getEmptySnippet(): CodeSnippet {
    return {
      title: '',
      code: '',
      language: this.selectedLanguage
    };
  }

  private initSqlContext(): void {
    this.sqlContext = this.getSqlContext();
  }

  isTalent(): boolean {
    const role = this.authService.getCurrentRole();
    return role?.includes(ROLES.TALENT) ?? false;
  }

  isInterviewTalent(): boolean {
    return this.mode === 'interview' && this.isTalent();
  }

  openInterviewNotice() {
    this.showClipboardNotification(
      'Interview Mode: Clipboard actions may be monitored and shared with interview participants.', 'info'
    );
  }

  loadDefaultSnippets() {
    this.defaultSnippets = DEFAULT_SNIPPETS[this.selectedLanguage] || [];
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    console.log('onPaste detected');
    if (this.isInterviewTalent()) {
      const text = event.clipboardData?.getData('text') || '';
      this.emitClipboardEvent(ClipboardEventType.PASTE, text.length);
      console.log('Paste detected');
    }
  }

  @HostListener('copy', ['$event'])
  onCopy(event: ClipboardEvent) {
    console.log('onCopy detected');
    if (this.isInterviewTalent()) {
      this.emitClipboardEvent(ClipboardEventType.COPY);
      console.log('Copy detected');
    }
  }

  @HostListener('window:mouseout', ['$event'])
  onMouseOut(event: MouseEvent) {
    console.log('onMouseOut detected');
    if (!this.isInterviewTalent()) return;

    if (!event.relatedTarget) {
      this.emitFocusEvent(FocusEventType.MOUSE_LEAVE);
    }
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    console.log('onVisibilityChange detected');
    if (!this.isInterviewTalent()) return;

    if (document.hidden) {
      this.emitFocusEvent(FocusEventType.TAB_HIDDEN);
    }
  }

  @HostListener('window:blur')
  onWindowBlur() {
    console.log('onWindowBluronMouseOut detected');
    if (!this.isInterviewTalent()) return;

    this.emitFocusEvent(FocusEventType.WINDOW_BLUR);
  }

  emitFocusEvent(type: FocusEventType) {
    if (!this.isInterviewTalent()) return;
    const now = Date.now();
    this.focusEventBuffer.push({ type, timestamp: now });
    clearTimeout(this.focusTimeout);
    this.focusTimeout = setTimeout(() => {
      this.flushFocusEvents(type);
    }, 200); 
  }

  private flushFocusEvents(type: FocusEventType) {
    if (!this.focusEventBuffer.length) return;

    const PRIORITY: Record<string, number> = {
      tab_hidden: 3,
      window_blur: 2,
      mouse_leave: 1
    };

    const bestEvent = this.focusEventBuffer.reduce((prev, curr) => {
      return PRIORITY[curr.type] > PRIORITY[prev.type] ? curr : prev;
    });

    this.socketService.sendChangeFocusEvent({
      type: type,
    });

    this.focusEventBuffer = [];
  }

  emitClipboardEvent(type: ClipboardEventType, length?: number) {
    this.socketService.sendClipboardEvent({
      type: type,
      length: length
    });
  }

  handlePaste = (event: ClipboardEvent) => {
    console.log('GLOBAL paste detected');

    if (!this.isInterviewTalent()) return;

    const text = event.clipboardData?.getData('text') || '';

    this.emitClipboardEvent(ClipboardEventType.PASTE, text.length);
  };

  private resolveRoom(): void {
    const roomId = this.route.snapshot.paramMap.get('roomId');
    console.log('roomId from route', roomId);
    const userId = this.route.snapshot.paramMap.get('userId');
    console.log('userId from route', userId);

    if (roomId) {
      this.mode = 'interview';
      this.roomId = roomId;
    } else if (userId) {
      this.mode = 'personal';
      this.roomId = `user-${userId}`;
    } else {
      console.error('No roomId or userId provided!');
      return;
    }

    console.log('Joining room:', this.roomId);
  }

  private resolveUser(): { idToken: string; email: string; name: string } {
    const idToken =
      sessionStorage.getItem(
        `${environment.storage.prefixToken}${sessionStorage.getItem(`${environment.storage.userId}`)}`
      ) ?? '';

    const decodedToken = this.authService.decodeJWTToken(idToken);

    return {
      idToken,
      email: decodedToken?.user?.email || 'Unknown',
      name: decodedToken?.user?.firstname || 'Unknown'
    };
  }

  private initSocket(idToken: string, name: string, email: string): void {
    this.socketService.connect(idToken);
    this.socketService.joinRoom(this.roomId, idToken, name, email);
  }

  private initSocketListeners(): void {
    this.subCodeOutput = this.socketService
    .onCodeOutput()
    .pipe(takeUntil(this._onDestroy))
    .subscribe((data: string) => {
      this.isRunning = false;
      if(this.selectedLanguage === ProgrammingLanguage.SQL) {
        this.isSqlExecuted = true;
        const response = JSON.parse(data);
        if (!response.success) {
          this.sqlSuccess = false;
          this.sqlError = response.error;
          this.sqlResult = [];
          return;
        }
        this.sqlError = '';
        this.sqlSuccess = response.success;
        this.sqlResult = response.result;
        this.sqlPassed = response.passed;
        this.queryType = response.queryType;
        this.rowCount = response.rowCount;
        this.executionTime = response.executionTime;
      } else {
        this.output = data;
      }
      this.cdr.markForCheck();
    });

    this.subCodeUpdate = this.socketService
    .onCodeUpdate()
    .pipe(takeUntil(this._onDestroy))
    .subscribe((incomingCode) => {
      this.isRemoteUpdate = true;

      if (this.editor?.getModel()) {
        const model = this.editor.getModel();

        if (model?.getValue() !== incomingCode) {
          const selections = this.editor.getSelections();

          model?.pushEditOperations(
            [],
            [{ range: model.getFullModelRange(), text: incomingCode }],
            () => selections
          );
        }
      }

      this.cdr.markForCheck();
    });

    this.socketService.onClipboardUsage()
    .pipe(takeUntil(this._onDestroy))
    .subscribe((data) => {
      console.log('Received onClipboardUsage update', data);
      this.handleClipboardUsage(data);
      this.cdr.markForCheck();
    });

    this.socketService.onFocusChange()
    .pipe(takeUntil(this._onDestroy))
    .subscribe((data) => {
      console.log('Received onFocusChange update', data);
      this.handleClipboardUsage(data);
      this.cdr.markForCheck();
    });

    this.subLanguageUpdate = this.socketService
    .onLanguageChange()
    .pipe(takeUntil(this._onDestroy))
    .subscribe((data) => {
      console.log('Received language update', data);
      console.log('data.userId === this.userId', data.userId === this.userId);
      if (!data || data.userId === this.userId) {
        return;
      }

      this.selectedLanguage = data.language;

      if (this.editor?.getModel()) {
        monaco.editor.setModelLanguage(this.editor.getModel()!, data.language);
      }

      this.cdr.markForCheck();
    });

    this.codeChange$
    .pipe(debounceTime(200), takeUntil(this._onDestroy))
    .subscribe((value) => {
      if (!this.isRemoteUpdate) {
        this.socketService.sendCodeChange({
          roomId: this.roomId,
          code: value
        });
      }

      this.isRemoteUpdate = false;
    });

  this.languageChange$
    .pipe(debounceTime(200), takeUntil(this._onDestroy))
    .subscribe((language) => {
      this.socketService.sendLanguageChange({
        roomId: this.roomId,
        language
      });
    });
  }

  handleClipboardUsage(data: { type: string; length?: number }) {
    console.log('handleClipboardUsage', data)
    if (!data?.type) return;

    let message = '';

    switch (data.type) {
      case ClipboardEventType.COPY:
        message = 'Candidate has copied code';
        break;

      case ClipboardEventType.PASTE:
        message = `Candidate has pasted code${data.length ? ` (${data.length} chars)` : ''}`;
        break;

      case FocusEventType.MOUSE_LEAVE:
        message = 'Candidate moved cursor outside the window';
        break;

      case FocusEventType.TAB_HIDDEN:
        message = 'Candidate switched browser tab';
        break;

      case FocusEventType.WINDOW_BLUR:
        message = 'Candidate switched application';
        break;

      default:
        message = `Clipboard activity: ${data.type}`;
    }

    console.log('handleClipboardUsage message', message);

    this.showClipboardNotification(message, 'warning');
  }

  showClipboardNotification(message: string, type: 'info' | 'warning' | 'danger' = 'info') {
    const id = ++this.notificationId;

    this.notifications = [
      ...this.notifications,
      { id, message, type }
    ];

    setTimeout(() => {
      this.removeNotification(id);
      this.cdr.markForCheck();
    }, 5000);
  }

  removeNotification(id: number) {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  setupTypeScript() {
    const ts = monaco.languages.typescript as any;

    ts.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    ts.typescriptDefaults.setCompilerOptions({
      target: ts.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
    });
  }

  addTable() {
    this.sqlContext.tables.forEach(table => { table.isExpanded = false; });
    const index = this.sqlContext.tables.length + 1;
    const table: SqlTable = {
      name: `Table${index}`,
      isExpanded: true,
      columns: [
        {
          name: 'Id',
          type: SqlColumnType.INTEGER,
          primaryKey: true,
          autoIncrement: true
        }
      ],
      rows: []
    };
    this.sqlContext.tables.unshift(table);
    this.cdr.markForCheck();
  }

  deleteTable(table: SqlTable) {
    this.sqlContext.tables = this.sqlContext.tables.filter(t => t !== table);
    if (!this.sqlContext.tables.some(t => t.isExpanded) && this.sqlContext.tables.length) {
      this.sqlContext.tables[0].isExpanded = true;
    }
    this.cdr.markForCheck();
  }

  initEditor() {
    const initialCode = languageTemplates[this.selectedLanguage] || '';

    this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
      value: initialCode,
      language: 'javascript',
      theme: 'vs-dark',
      automaticLayout: true,
      lineNumbers: 'on',
      minimap: { enabled: true, side: 'right', size: 'proportional',scale: 1.3 },
      fontSize: 20,
      lineHeight: 26,
      renderLineHighlight: 'all',
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      wordWrap: 'on',
      roundedSelection: true,
      folding: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
    });
    monaco.editor.EditorZoom.setZoomLevel(1.3);

    this.setupTypeScript();
    this.setupShortcuts();

    this.editor.onDidChangeModelContent((e) => {
      const value = this.editor.getValue();
      this.codeChange$.next(value); 
    });

    //this.initLiveCursors();
  }

  setupShortcuts() {
    this.editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => {
        this.editor.getAction('editor.action.formatDocument')?.run();
      }
    );

    this.editor.addAction({
      id: 'run-command',
      label: 'Run Format',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP],
      run: () => {
        this.editor.getAction('editor.action.formatDocument')?.run();
      }
    });
  }

  showError(line: number, colStart: number, colEnd: number, message: string) {
    const model = this.editor.getModel();
    if (!model) return;

    monaco.editor.setModelMarkers(model, 'owner', [
      {
        startLineNumber: line,
        startColumn: colStart,
        endLineNumber: line,
        endColumn: colEnd,
        message,
        severity: monaco.MarkerSeverity.Error
      }
    ]);
  }

  initLiveCursors() {
    this.editor.onDidChangeCursorPosition((e) => {
      const position = e.position;
      this.socketService.sendCursorMove({
        roomId: this.roomId,
        position
      });
    });

    this.socketService.onCursorMove().pipe(takeUntil(this._onDestroy)).subscribe((data) => {
      console.log('Received remote cursor move in initLiveCursors', data);
      if(this.userId === data.userId) {
        return; // Ignore own cursor moves
      }
      if (!data || !this.editor) {
        return;
      }

      const { lineNumber, column } = data.position;
      const model = this.editor.getModel();
      if (model && lineNumber <= model.getLineCount()) {
        //const lineLength = model.getLineMaxColumn(lineNumber);
        const lineCount = model.getLineCount();
        const safeLineNumber = Math.min(Math.max(1, lineNumber), lineCount); // clamp between 1 and lineCount
        const lineLength = model.getLineMaxColumn(safeLineNumber);
        const cursorRange = new monaco.Range(lineNumber, Math.min(column, lineLength), lineNumber, Math.min(column + 1, lineLength));
        const cursorColors = [
          '#FFB400', // golden yellow
          '#1E90FF', // dodger blue
          '#32CD32', // lime green
          '#FF69B4', // hot pink
          '#8A2BE2', // blueviolet
          '#FF7F50', // coral
          '#00CED1', // dark turquoise
        ];
        const colorIndex = Math.abs(this.hashCode(data.userId)) % cursorColors.length;
        const color = cursorColors[colorIndex];
        // this.remoteCursorDecorations = this.editor.deltaDecorations(
        //   this.remoteCursorDecorations || [],
        //   [{
        //     range: cursorRange,
        //     options: {
        //       className: 'remote-cursor',
        //       //afterContentClassName: 'remote-cursor-label'
        //     }
        //   }]
        // );
      }
      this.cdr.markForCheck();
    });
  }

  hashCode(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }

  onLanguageChange(language: string) {
    console.log('Language changed to', language);
    this.selectedLanguage = language as ProgrammingLanguage;
    if (language === ProgrammingLanguage.SQL) {
      this.initSqlContext();
    }
    this.newSnippet.language = language;
    this.aiSelectedLanguage = language as ProgrammingLanguage;
    this.output = '';
    this.socketService.sendLanguageChange({ roomId: this.roomId, language });
    this.isRemoteUpdate = false;

    if (this.editor && this.editor.getModel()) {
      monaco.editor.setModelLanguage(this.editor.getModel()!, language);

      const template = languageTemplates[language];
      if (template) {
        this.editor.setValue(template);
      }
    }

    if(this.activeTab === 'default') {
      this.loadDefaultSnippets();
      this.cdr.markForCheck();
    }
    if(this.activeTab === 'personal') {
      this.pageIndex = 0;
      this.loadPersonalSnippets();
    }

    this.cdr.markForCheck();
  }

  onTableChange(updatedTable: SqlTable): void {
    if (!this.sqlContext) {
      return;
    }
    const index = this.sqlContext.tables.findIndex(
      t => t.name === updatedTable.name
    );
    if (index >= 0) {
      this.sqlContext.tables[index] = updatedTable;
    }
    this.cdr.markForCheck();
  }

  runCode() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.output = '';
    this.cdr.markForCheck();  
    // this.socketService.runCode({
    //   code: this.editor.getValue(),
    //   language: this.selectedLanguage,
    //   roomId: this.roomId
    // });
    const payload: any = {
      code: this.editor.getValue(),
      language: this.selectedLanguage,
      roomId: this.roomId
    };

    if (this.selectedLanguage === 'sql') {
      payload.sqlContext = this.sqlContext; 
    }

    this.socketService.runCode(payload);
  }

  private getSqlContext(): SqlExecutionContext {
    return {
      tables: [
        {
          name: 'Users',
          isExpanded: true,
          columns: [
            {
              name: 'Id',
              type: SqlColumnType.INTEGER,
              primaryKey: true
            },
            {
              name: 'Name',
              type: SqlColumnType.TEXT
            }
          ],
          rows: [
            {
              Id: 1,
              Name: 'John'
            },
            {
              Id: 2,
              Name: 'Alice'
            }
          ]
        },
        {
          name: 'Orders',
          isExpanded: false,
          columns: [
            {
              name: 'Id',
              type: SqlColumnType.INTEGER,
              primaryKey: true
            },
            {
              name: 'UserId',
              type: SqlColumnType.INTEGER
            },
            {
              name: 'Amount',
              type: SqlColumnType.INTEGER
            }
          ],
          rows:[
            {
              Id: 1,
              UserId: 1,
              Amount: 100
            },
            {
              Id: 2,
              UserId: 1,
              Amount: 200
            },
            {
              Id: 3,
              UserId: 2,
              Amount: 300
            }
          ]
        }
      ],
      testCases:[
        {
          expectedResult:[
            {
              Name: 'John'
            },
            {
              Name: 'Alice'
            }
          ]
        }

      ]
    };
  }

  insertSnippet(snippet: CodeSnippet, mode: 'insert' | 'replace' = 'insert') {
    if (!this.editor) return;

    if (mode === 'replace') {
      this.editor.setValue(snippet.code);
      return;
    }

    const selection = this.editor.getSelection();
    if(!selection) return;

    this.editor.executeEdits('', [
      {
        range: selection,
        text: '\n' + snippet.code + '\n',
        forceMoveMarkers: true
      }
    ]);
  }

  private saveSnippet$(): Observable<CodeSnippet | null> {
    if (!this.newSnippet.title || !this.newSnippet.code) {
      return of(null);
    }

    const snippet: CodeSnippet = { ...this.newSnippet };

    return this.codeSnippetsService
      .createAsync(snippet, true, false)
      .pipe(
        take(1),
        tap((createdSnippet) => {
          if (createdSnippet) {
            this.personalSnippets.unshift(createdSnippet);
            this.newSnippet = this.getEmptySnippet();
            this.cdr.markForCheck();
          }
        }),
        catchError(() => of(null))
      );
  }

  saveSnippet() {
    this.saveSnippet$().pipe(take(1)).subscribe();
  }

  saveAndInsertSnippet() {
    this.saveSnippet$().pipe(take(1)).subscribe((createdSnippet) => {
      if (createdSnippet) {
        this.insertSnippet(createdSnippet);
      }
    });
  }

  deleteSnippet(snippetId: string) {
    this.codeSnippetsService
      .deleteAsync(snippetId, true, false)
      .pipe(take(1))
      .subscribe({
        next: (deleted) => {
          console.log('Snippet deleted', deleted);
          this.personalSnippets = this.personalSnippets.filter(
            s => s._id !== snippetId
          );
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error deleting snippet', err);
          this.cdr.markForCheck();
        },
    });
  }

  switchTab(tab: SnippetTab) {
    this.activeTab = tab;
    if(this.activeTab === 'default') {
      this.loadDefaultSnippets();
      this.cdr.markForCheck();
    }
    if(this.activeTab === 'personal') {
      this.pageIndex = 0;
      this.loadPersonalSnippets();
    }
  }

  private buildPersonalSnippetsFilters(): any[] {
    const filters: Filtering = [];

    // ✅ static filter (always applied)
    filters.push({
      property: getPropertyName<OwnerEntity>((e: OwnerEntity) => e.userId),
      rule: FilterRule.EQUALS,
      value: `${sessionStorage.getItem(`${environment.storage.userId}`)}`
    });

    // ✅ dynamic filter (only if language selected)
    if (this.selectedLanguage) {
      filters.push({
        property: 'language',
        rule: FilterRule.EQUALS,
        value: `^${this.selectedLanguage}$`
      });
    }

    return filters;
  }

  loadPersonalSnippets() {
    this.isPersonalSnippetsLoading = true;
    this.cdr.markForCheck();
    const filters = this.buildPersonalSnippetsFilters();
    this.codeSnippetsService
    .getAllAsync(this.pageSize, this.pageIndex, this.sorting, filters, true, false)
    .pipe(take(1))
    .subscribe({
      next: (res) => {
        console.log('Personal Snippets', res);
        if(res) {
          this.personalSnippets = res.items;
          this.pageIndex++;
          this.isPersonalSnippetsLoading = false;
          this.cdr.markForCheck();
        }
      }, 
      error: (err) => {
        console.error('Error receiving personal snippets', err);
        this.isPersonalSnippetsLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  addPersonalSnippet() {
    const newSnippet: CodeSnippet = {
      _id: Date.now().toString(),
      title: 'New Snippet',
      code: '// your code...',
      language: this.selectedLanguage
    };

    this.personalSnippets.push(newSnippet);
  }

  private detectLanguageFromPrompt(prompt: string): ProgrammingLanguage | null {
    const lower = prompt.toLowerCase();

    for (const key of Object.keys(languageKeywordsMap)) {
      if (lower.includes(key)) {
        return languageKeywordsMap[key];
      }
    }

    return null;
  }

  generateSnippet$(): Observable<CodeSnippet | null> {
    if (!this.aiPrompt.trim()) {
      this.aiError = 'Please enter a description.';
      return of(null);
    }

    const detectedLang = this.detectLanguageFromPrompt(this.aiPrompt);

      if (detectedLang) {
        this.aiSelectedLanguage = detectedLang;
      }

    this.aiError = '';
    this.isGenerating = true;

    return this.codeSnippetsService
      .generateCodeSnippet(this.aiPrompt, this.aiSelectedLanguage, true)
      .pipe(
        take(1),
        tap((generatedSnippet: CodeSnippet) => {
          console.log('Generated snippet', generatedSnippet);
          if (generatedSnippet) {
            this.aiGeneratedSnippet = generatedSnippet;
          }
          this.isGenerating = false;
          this.cdr.markForCheck();
        }),
        catchError((err) => {
          console.error('Error generating snippet', err);

          this.aiError = 'Failed to generate snippet. Try again.';
          this.isGenerating = false;
          this.cdr.markForCheck();

          return of(null);
        })
      );
  }

  generateSnippet() {
    this.aiGeneratedSnippet = null;
    this.generateSnippet$().pipe(take(1)).subscribe();
  }

  saveGeneratedSnippet() {
    if (!this.aiGeneratedSnippet) return;

    this.newSnippet = { ...this.aiGeneratedSnippet };
    this.saveSnippet();
  }

  ngOnDestroy(): void {
    document.removeEventListener('paste', this.handlePaste, true);
    this._onDestroy.next();
    this._onDestroy.complete();

    this.socketService.disconnect();

    this.subCodeUpdate?.unsubscribe();
    this.subCodeOutput?.unsubscribe();
    this.subRemoteCursorMove?.unsubscribe();
    this.subLanguageUpdate?.unsubscribe();

    if (this.editor) {
      const model = this.editor.getModel();
      this.editor.dispose();
      model?.dispose();
      this.editor = null!;
    }
  }

  clearInput() {
    if (this.editor) {
      this.editor.setValue('');
      const value = this.editor.getValue();
      this.codeChange$.next(value); 
      this.cdr.markForCheck();
    }
  }

  clearOutput() {
    this.output = '';
    this.cdr.markForCheck();
  }

  stopCode() { }
}