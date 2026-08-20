export const languageTemplates: Record<string, string> = {
  javascript: `function sum(a, b) {
  return a + b;
}
console.log(sum(2, 3));`,

  typescript: `class Calculator {
  sum(a: number, b: number): number {
    return a + b;
  }
}

const calc = new Calculator();
console.log(calc.sum(2, 3));`,

  python: `def sum(a, b):
    return a + b

print(sum(2, 3))`,

  csharp: `using System;

class Program {
  static int Sum(int a, int b) {
    return a + b;
  }

  static void Main() {
    Console.WriteLine(Sum(2, 3));
  }
}`,

  java: `public class Main {
  public static int sum(int a, int b) {
    return a + b;
  }

  public static void main(String[] args) {
    System.out.println(sum(2, 3));
  }
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
  cout << "Hello, C++!" << endl;
  return 0;
}`,
  sql: `-- Write your SQL query here
SELECT * FROM Users;`
};