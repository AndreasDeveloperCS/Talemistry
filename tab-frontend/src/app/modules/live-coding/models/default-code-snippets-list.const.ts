import { CodeSnippet } from "./code-snippet.model";

export const DEFAULT_SNIPPETS: Record<string, CodeSnippet[]> = {
  javascript: [
    {
      _id: 'js-debounce',
      title: 'Debounce Function',
      language: 'javascript',
      code: `function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}`
    },
    {
      _id: 'js-fetch-api',
      title: 'Fetch API (async/await)',
      language: 'javascript',
      code: `async function getData(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}`
    },
    {
      _id: 'js-array-group',
      title: 'Group By',
      language: 'javascript',
      code: `const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    (acc[item[key]] = acc[item[key]] || []).push(item);
    return acc;
  }, {});`
    },
    {
      _id: 'js-event-delegation',
      title: 'Event Delegation',
      language: 'javascript',
      code: `document.body.addEventListener('click', (e) => {
  if (e.target.matches('.btn')) {
    console.log('Button clicked');
  }
});`
    },
    {
      _id: 'js-deep-clone',
      title: 'Deep Clone',
      language: 'javascript',
      code: `const deepClone = (obj) => JSON.parse(JSON.stringify(obj));`
    },
    {
      _id: 'js-throttle',
      title: 'Throttle Function',
      language: 'javascript',
      code: `function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}`
    },
    {
      _id: 'js-once',
      title: 'Run Once Function',
      language: 'javascript',
      code: `function once(fn) {
  let called = false;
  return (...args) => {
    if (!called) {
      called = true;
      return fn(...args);
    }
  };
}`
    },
    {
      _id: 'js-memoize',
      title: 'Memoization',
      language: 'javascript',
      code: `function memoize(fn) {
  const cache = {};
  return (...args) => {
    const key = JSON.stringify(args);
    if (!cache[key]) {
      cache[key] = fn(...args);
    }
    return cache[key];
  };
}`
    },
    {
      _id: 'js-flatten-array',
      title: 'Flatten Nested Array',
      language: 'javascript',
      code: `const flatten = (arr) =>
  arr.reduce((acc, val) =>
    acc.concat(Array.isArray(val) ? flatten(val) : val), []);`
    },
    {
      _id: 'js-promise-all-limit',
      title: 'Promise.all with Concurrency Limit',
      language: 'javascript',
      code: `async function promiseAllLimit(tasks, limit) {
  const results = [];
  const executing = [];

  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);

    if (limit <= tasks.length) {
      const e = p.then(() =>
        executing.splice(executing.indexOf(e), 1)
      );
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}`
    },
    {
      _id: 'js-curry',
      title: 'Function Currying',
      language: 'javascript',
      code: `const curry = (fn) =>
function curried(...args) {
  return args.length >= fn.length
    ? fn(...args)
    : (...next) => curried(...args, ...next);
};`
    },
    {
      _id: 'js-unique-array',
      title: 'Unique Array Values',
      language: 'javascript',
      code: `const unique = (arr) => [...new Set(arr)];`
    },
    {
      _id: 'js-sleep',
      title: 'Sleep (delay)',
      language: 'javascript',
      code: `const sleep = (ms) =>
      new Promise(resolve => setTimeout(resolve, ms));`
    },
    {
      _id: 'js-url-params',
      title: 'Parse URL Params',
      language: 'javascript',
      code: `const getParams = () =>
  Object.fromEntries(new URLSearchParams(window.location.search));`
    },
    {
      _id: 'js-safe-access',
      title: 'Safe Nested Access',
      language: 'javascript',
      code: `const get = (obj, path) =>
  path.split('.').reduce((o, key) => o?.[key], obj);`
    }
  ],

  typescript: [
    {
      _id: 'ts-generic',
      title: 'Generic Function',
      language: 'typescript',
      code: `function _identity<T>(value: T): T {
  return value;
}`
    },
    {
      _id: 'ts-enum',
      title: 'Enum Usage',
      language: 'typescript',
      code: `enum Status {
  Pending = 'PENDING',
  Done = 'DONE'
}`
    },
    {
      _id: 'ts-type-guard',
      title: 'Type Guard',
      language: 'typescript',
      code: `function isString(value: unknown): value is string {
  return typeof value === 'string';
}`
    },
    {
      _id: 'ts-interface-extend',
      title: 'Interface Extension',
      language: 'typescript',
      code: `interface User {
  _id: number;
}

interface Admin extends User {
  role: string;
}`
    },
    {
      _id: 'ts-union',
      title: 'Union Type Handling',
      language: 'typescript',
      code: `function print(value: string | number) {
  if (typeof value === 'string') {
    console.log(value.toUpperCase());
  }
}`
    },
    {
      _id: 'ts-partial',
      title: 'Partial Utility Type',
      language: 'typescript',
      code: `interface User {
  name: string;
  age: number;
}

const updateUser = (user: Partial<User>) => user;`
    },
    {
      _id: 'ts-pick',
      title: 'Pick Utility',
      language: 'typescript',
      code: `type UserPreview = Pick<User, 'name'>;`
    },
    {
      _id: 'ts-omit',
      title: 'Omit Utility',
      language: 'typescript',
      code: `type UserWithoutAge = Omit<User, 'age'>;`
    },
    {
      _id: 'ts-record',
      title: 'Record Type',
      language: 'typescript',
      code: `const roles: Record<string, number> = {
  admin: 1,
  user: 2
};`
    },
    {
      _id: 'ts-unknown-safe',
      title: 'Unknown Safe Parsing',
      language: 'typescript',
      code: `function parse(value: unknown) {
  if (typeof value === 'string') return value;
  return '';
}`
    },
    {
      _id: 'ts-discriminated-union',
      title: 'Discriminated Union',
      language: 'typescript',
      code: `type Shape =
  | { type: 'circle'; radius: number }
  | { type: 'square'; size: number };

function area(shape: Shape) {
  switch (shape.type) {
    case 'circle': return Math.PI * shape.radius ** 2;
    case 'square': return shape.size ** 2;
  }
}`
    },
    {
      _id: 'ts-readonly',
      title: 'Readonly Object',
      language: 'typescript',
      code: `const config: Readonly<{ api: string }> = {
  api: 'url'
};`
    },
    {
      _id: 'ts-keyof',
      title: 'Keyof Usage',
      language: 'typescript',
      code: `function getProp<T, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}`
    },
    {
      _id: 'ts-mapped-type',
      title: 'Mapped Type',
      language: 'typescript',
      code: `type Optional<T> = {
  [K in keyof T]?: T[K];
};`
    },
    {
      _id: 'ts-assertion',
      title: 'Type Assertion',
      language: 'typescript',
      code: `const value = someVar as string;`
    }
  ],

  python: [
    {
      _id: 'py-list-comp',
      title: 'List Comprehension',
      language: 'python',
      code: `squares = [x**2 for x in range(10)]`
    },
    {
      _id: 'py-decorator',
      title: 'Decorator',
      language: 'python',
      code: `def my_decorator(func):
    def wrapper():
        print("Before")
        func()
        print("After")
    return wrapper`
    },
    {
      _id: 'py-read-file',
      title: 'Read File',
      language: 'python',
      code: `with open('file.txt', 'r') as f:
    data = f.read()`
    },
    {
      _id: 'py-try-except',
      title: 'Exception Handling',
      language: 'python',
      code: `try:
    x = int(input())
except ValueError:
    print("Inval_id number")`
    },
    {
      _id: 'py-dict-merge',
      title: 'Merge Dictionaries',
      language: 'python',
      code: `merged = {**dict1, **dict2}`
    },
    {
      _id: 'py-lambda',
      title: 'Lambda Function',
      language: 'python',
      code: `add = lambda a, b: a + b`
    },
    {
      _id: 'py-map-filter',
      title: 'Map & Filter',
      language: 'python',
      code: `nums = [1,2,3]
res = list(filter(lambda x: x > 1, nums))`
    },
    {
      _id: 'py-enumerate',
      title: 'Enumerate Loop',
      language: 'python',
      code: `for i, val in enumerate(items):
  print(i, val)`
    },
    {
      _id: 'py-zip',
      title: 'Zip Lists',
      language: 'python',
      code: `for a, b in zip(list1, list2):
  print(a, b)`
    },
    {
      _id: 'py-defaultdict',
      title: 'DefaultDict',
      language: 'python',
      code: `from collections import defaultdict
  d = defaultdict(int)`
    },
    {
      _id: 'py-dataclass',
      title: 'Dataclass',
      language: 'python',
      code: `from dataclasses import dataclass

@dataclass
class User:
    name: str
    age: int`
    },
    {
      _id: 'py-json',
      title: 'JSON Parsing',
      language: 'python',
      code: `import json
data = json.loads(json_string)`
    },
    {
      _id: 'py-generator',
      title: 'Generator',
      language: 'python',
      code: `def count(n):
  for i in range(n):
      yield i`
    },
    {
      _id: 'py-args-kwargs',
      title: '*args and **kwargs',
      language: 'python',
      code: `def func(*args, **kwargs):
  print(args, kwargs)`
    },
    {
      _id: 'py-pathlib',
      title: 'Pathlib Usage',
      language: 'python',
      code: `from pathlib import Path
    p = Path('file.txt')
    print(p.exists())`
    }
  ],

  java: [
    {
      _id: 'java-singleton',
      title: 'Singleton Pattern',
      language: 'java',
      code: `public class Singleton {
  private static Singleton instance;

  private Singleton() {}

  public static Singleton getInstance() {
    if (instance == null) {
      instance = new Singleton();
    }
    return instance;
  }
}`
    },
    {
      _id: 'java-stream-filter',
      title: 'Stream Filter',
      language: 'java',
      code: `list.stream()
  .filter(x -> x > 10)
  .forEach(System.out::println);`
    },
    {
      _id: 'java-try-catch',
      title: 'Try-Catch',
      language: 'java',
      code: `try {
  int x = Integer.parseInt("123");
} catch (NumberFormatException e) {
  e.printStackTrace();
}`
    },
    {
      _id: 'java-thread',
      title: 'Thread Creation',
      language: 'java',
      code: `new Thread(() -> {
  System.out.println("Running");
}).start();`
    },
    {
      _id: 'java-map-iterate',
      title: 'Map Iteration',
      language: 'java',
      code: `for (Map.Entry<String, Integer> entry : map.entrySet()) {
  System.out.println(entry.getKey());
}`
    },
    {
      _id: 'java-optional',
      title: 'Optional Usage',
      language: 'java',
      code: `Optional<String> value = Optional.ofNullable(null);
  value.ifPresent(System.out::println);`
    },
    {
      _id: 'java-builder',
      title: 'Builder Pattern',
      language: 'java',
      code: `class User {
  private String name;

  public static class Builder {
    private String name;

    public Builder setName(String name) {
      this.name = name;
      return this;
    }

    public User build() {
      User u = new User();
      u.name = this.name;
      return u;
    }
  }
}`
    },
    {
      _id: 'java-comparator',
      title: 'Custom Comparator',
      language: 'java',
      code: `list.sort((a, b) -> a.getAge() - b.getAge());`
    },
    {
      _id: 'java-file-read',
      title: 'Read File',
      language: 'java',
      code: `Files.lines(Paths.get("file.txt"))
  .forEach(System.out::println);`
    },
    {
      _id: 'java-executor',
      title: 'Executor Service',
      language: 'java',
      code: `ExecutorService executor = Executors.newFixedThreadPool(2);
executor.submit(() -> System.out.println("Task"));`
    },
    {
      _id: 'java-hashmap',
      title: 'HashMap Usage',
      language: 'java',
      code: `Map<String, Integer> map = new HashMap<>();
map.put("a", 1);`
    },
    {
      _id: 'java-synchronized',
      title: 'Synchronized Block',
      language: 'java',
      code: `synchronized(this) {
  // critical section
    }`
    },
    {
      _id: 'java-immutable',
      title: 'Immutable Class',
      language: 'java',
      code: `final class User {
  private final String name;

  public User(String name) {
    this.name = name;
  }
}`
    },
    {
      _id: 'java-stream-map',
      title: 'Stream Map',
      language: 'java',
      code: `list.stream()
  .map(String::toUpperCase)
  .forEach(System.out::println);`
    },
    {
      _id: 'java-annotation',
      title: 'Custom Annotation',
      language: 'java',
      code: `@interface MyAnnotation {
  String value();
}`
    }
  ],

  csharp: [
    {
      _id: 'cs-linq',
      title: 'LINQ Filter',
      language: 'csharp',
      code: `var result = list.Where(x => x > 10).ToList();`
    },
    {
      _id: 'cs-async-await',
      title: 'Async/Await',
      language: 'csharp',
      code: `public async Task GetData() {
  var data = await httpClient.GetStringAsync("url");
}`
    },
    {
      _id: 'cs-props',
      title: 'Auto Properties',
      language: 'csharp',
      code: `public string Name { get; set; }`
    },
    {
      _id: 'cs-null-check',
      title: 'Null Check',
      language: 'csharp',
      code: `if (obj is null) {
  throw new ArgumentNullException();
}`
    },
    {
      _id: 'cs-dependency-injection',
      title: 'Dependency Injection',
      language: 'csharp',
      code: `services.AddScoped<IMyService, MyService>();`
    },
    {
      _id: 'cs-linq-select',
      title: 'LINQ Select',
      language: 'csharp',
      code: `var names = list.Select(x => x.Name).ToList();`
    },
    {
      _id: 'cs-null-coalescing',
      title: 'Null Coalescing',
      language: 'csharp',
      code: `var name = input ?? "default";`
    },
    {
      _id: 'cs-using',
      title: 'Using Statement',
      language: 'csharp',
      code: `using (var stream = new FileStream("file.txt", FileMode.Open)) {
}`
    },
    {
      _id: 'cs-record',
      title: 'Record Type',
      language: 'csharp',
      code: `public record User(string Name, int Age);`
    },
    {
      _id: 'cs-switch',
      title: 'Switch Expression',
      language: 'csharp',
      code: `var result = x switch {
  > 0 => "positive",
  _ => "other"
};`
    },
    {
      _id: 'cs-extension',
      title: 'Extension Method',
      language: 'csharp',
      code: `public static class Extensions {
  public static bool IsEven(this int x) => x % 2 == 0;
}`
    },
    {
      _id: 'cs-tryparse',
      title: 'TryParse',
      language: 'csharp',
      code: `int.TryParse("123", out int result);`
    },
    {
      _id: 'cs-task-run',
      title: 'Task.Run',
      language: 'csharp',
      code: `await Task.Run(() => DoWork());`
    },
    {
      _id: 'cs-events',
      title: 'Event Handling',
      language: 'csharp',
      code: `public event Action OnChange;`
    },
    {
      _id: 'cs-config',
      title: 'Configuration Read',
      language: 'csharp',
      code: `var value = config["Key"];`
    }
  ],
  cpp: [
  {
    _id: 'cpp-hello-world',
    title: 'Hello World',
    language: 'cpp',
    code: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, C++!" << endl;
    return 0;
}`
  },
  {
    _id: 'cpp-fast-io',
    title: 'Fast Input Output',
    language: 'cpp',
    code: `#include <iostream>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int x;
    cin >> x;
    cout << x << "\\n";
    return 0;
}`
  },
  {
    _id: 'cpp-vector-usage',
    title: 'Vector Basics',
    language: 'cpp',
    code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> v = {1, 2, 3};
    v.push_back(4);

    for (int x : v) {
        cout << x << " ";
    }
}`
  },
  {
    _id: 'cpp-sort',
    title: 'Sort Array',
    language: 'cpp',
    code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> v = {5, 2, 8, 1};
    sort(v.begin(), v.end());

    for (int x : v) cout << x << " ";
}`
  },
  {
    _id: 'cpp-binary-search',
    title: 'Binary Search',
    language: 'cpp',
    code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> v = {1, 2, 3, 4, 5};
    int target = 3;

    if (binary_search(v.begin(), v.end(), target)) {
        cout << "Found";
    } else {
        cout << "Not Found";
    }
}`
  },
  {
    _id: 'cpp-map-frequency',
    title: 'Frequency Map',
    language: 'cpp',
    code: `#include <iostream>
#include <map>
using namespace std;

int main() {
    map<int, int> freq;
    int arr[] = {1, 2, 2, 3};

    for (int x : arr) {
        freq[x]++;
    }

    for (auto [key, val] : freq) {
        cout << key << ": " << val << endl;
    }
}`
  },
  {
    _id: 'cpp-unordered-map',
    title: 'Unordered Map',
    language: 'cpp',
    code: `#include <iostream>
#include <unordered_map>
using namespace std;

int main() {
    unordered_map<string, int> m;
    m["apple"] = 3;

    cout << m["apple"];
}`
  },
  {
    _id: 'cpp-stack',
    title: 'Stack Usage',
    language: 'cpp',
    code: `#include <iostream>
#include <stack>
using namespace std;

int main() {
    stack<int> st;
    st.push(1);
    st.push(2);

    while (!st.empty()) {
        cout << st.top() << " ";
        st.pop();
    }
}`
  },
  {
    _id: 'cpp-queue',
    title: 'Queue Usage',
    language: 'cpp',
    code: `#include <iostream>
#include <queue>
using namespace std;

int main() {
    queue<int> q;
    q.push(1);
    q.push(2);

    while (!q.empty()) {
        cout << q.front() << " ";
        q.pop();
    }
}`
  },
  {
    _id: 'cpp-two-sum',
    title: 'Two Sum (Hash Map)',
    language: 'cpp',
    code: `#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    vector<int> nums = {2, 7, 11, 15};
    int target = 9;

    unordered_map<int, int> mp;

    for (int i = 0; i < nums.size(); i++) {
        int diff = target - nums[i];
        if (mp.count(diff)) {
            cout << mp[diff] << ", " << i;
        }
        mp[nums[i]] = i;
    }
}`
  },
  {
    _id: 'cpp-reverse-string',
    title: 'Reverse String',
    language: 'cpp',
    code: `#include <iostream>
#include <algorithm>
using namespace std;

int main() {
    string s = "hello";
    reverse(s.begin(), s.end());
    cout << s;
}`
  },
  {
    _id: 'cpp-palindrome',
    title: 'Check Palindrome',
    language: 'cpp',
    code: `#include <iostream>
using namespace std;

bool isPalindrome(string s) {
    int l = 0, r = s.size() - 1;
    while (l < r) {
        if (s[l++] != s[r--]) return false;
    }
    return true;
}

int main() {
    cout << isPalindrome("racecar");
}`
  },
  {
    _id: 'cpp-factorial',
    title: 'Factorial (Recursion)',
    language: 'cpp',
    code: `#include <iostream>
using namespace std;

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    cout << factorial(5);
}`
  },
  {
    _id: 'cpp-fibonacci',
    title: 'Fibonacci (DP)',
    language: 'cpp',
    code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n = 10;
    vector<int> dp(n + 1);

    dp[0] = 0;
    dp[1] = 1;

    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }

    cout << dp[n];
}`
  },
  {
    _id: 'cpp-class',
    title: 'Basic Class Example',
    language: 'cpp',
    code: `#include <iostream>
using namespace std;

class Person {
public:
    string name;

    Person(string n) {
        name = n;
    }

    void greet() {
        cout << "Hello, " << name;
    }
};

int main() {
    Person p("Alice");
    p.greet();
}`
    }
  ],
  sql: [
    {
      _id: 'sql-select',
      title: 'Basic SELECT',
      language: 'sql',
      code: `-- Write your SQL query here
SELECT * FROM Users;`
    ,}
  ]
};